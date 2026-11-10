const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const db = require("./db");

const BACKUP_DIR = path.join(__dirname, "backups");
const CONFIG_FILE = path.join(BACKUP_DIR, "backup_config.json");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const DEFAULT_CONFIG = {
  auto_backup_enabled: true,
  interval_hours: 24,
  max_retention_copies: 30,
  last_backup_time: null,
  last_backup_status: null,
  last_backup_file: null,
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf8");
      return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading backup_config.json:", err.message);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Error saving backup_config.json:", err.message);
  }
}

/**
 * Creates an atomic point-in-time SQLite snapshot using VACUUM INTO
 */
async function createBackup({ type = "manual", note = "" } = {}) {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/T/, "_")
    .replace(/:/g, "-")
    .split(".")[0];
  const filename = `backup_${type}_${timestamp}.sqlite`;
  const targetPath = path.join(BACKUP_DIR, filename);

  return new Promise((resolve, reject) => {
    // 1. Truncate WAL to ensure all transactions are flushed to disk
    db.run("PRAGMA wal_checkpoint(TRUNCATE)", (chkErr) => {
      if (chkErr) {
        console.error("wal_checkpoint error:", chkErr);
      }

      // 2. Perform atomic vacuum into new file
      const escapedPath = targetPath.replace(/\\/g, "/");
      db.run(`VACUUM INTO '${escapedPath}'`, (vacErr) => {
        if (vacErr) {
          console.error(`VACUUM INTO failed for ${filename}:`, vacErr.message);
          const config = loadConfig();
          config.last_backup_status = `failed: ${vacErr.message}`;
          saveConfig(config);
          return reject(vacErr);
        }

        try {
          const stats = fs.statSync(targetPath);
          const config = loadConfig();
          config.last_backup_time = now.toISOString();
          config.last_backup_status = "success";
          config.last_backup_file = filename;
          saveConfig(config);

          // Apply auto-pruning if auto backup
          if (type === "auto") {
            pruneOldBackups(config.max_retention_copies);
          }

          resolve({
            filename,
            filepath: targetPath,
            size: stats.size,
            type,
            createdAt: now.toISOString(),
            note,
          });
        } catch (statErr) {
          reject(statErr);
        }
      });
    });
  });
}

/**
 * Prunes older auto-backups to maintain max retention copies
 */
function pruneOldBackups(maxCopies = 30) {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const autoBackups = files
      .filter((f) => f.startsWith("backup_auto_") && f.endsWith(".sqlite"))
      .map((f) => {
        const full = path.join(BACKUP_DIR, f);
        return { name: f, path: full, mtime: fs.statSync(full).mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime); // newest first

    if (autoBackups.length > maxCopies) {
      const toDelete = autoBackups.slice(maxCopies);
      toDelete.forEach((item) => {
        try {
          fs.unlinkSync(item.path);
          console.log(`[Backup Retention] Pruned old backup: ${item.name}`);
        } catch (e) {
          console.error("Error pruning backup:", e.message);
        }
      });
    }
  } catch (err) {
    console.error("Error in pruneOldBackups:", err.message);
  }
}

/**
 * Lists all backup files sorted by creation date (newest first)
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    return files
      .filter(
        (f) =>
          (f.endsWith(".sqlite") || f.endsWith(".db") || f.endsWith(".sql")) &&
          f !== "backup_config.json"
      )
      .map((f) => {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);

        let type = "manual";
        if (f.startsWith("backup_auto_")) type = "auto";
        else if (f.startsWith("backup_upload_")) type = "upload";
        else if (f.startsWith("backup_pre_restore_safety_")) type = "safety";

        return {
          filename: f,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime || stats.mtime,
          type,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error("Error listing backups:", err);
    return [];
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Validates a backup SQLite candidate file for integrity and required schema tables
 */
function validateBackupFile(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve({ valid: false, message: "File does not exist" });
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return resolve({ valid: false, message: "Backup file is empty (0 bytes)" });
    }

    // Verify SQLite header magic bytes ("SQLite format 3\0")
    try {
      const fd = fs.openSync(filePath, "r");
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);
      const header = buffer.toString("utf8");
      if (!header.startsWith("SQLite format 3")) {
        return resolve({
          valid: false,
          message: "Not a valid SQLite database file format",
        });
      }
    } catch (readErr) {
      return resolve({
        valid: false,
        message: `Failed to inspect file header: ${readErr.message}`,
      });
    }

    // Connect in read-only mode to verify schema & integrity
    const testDb = new sqlite3.Database(filePath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        return resolve({
          valid: false,
          message: `Cannot open SQLite database: ${err.message}`,
        });
      }

      testDb.all("PRAGMA integrity_check;", (intErr, intRows) => {
        if (intErr || !intRows || intRows[0]?.integrity_check !== "ok") {
          testDb.close();
          return resolve({
            valid: false,
            message: `Integrity check failed: ${intErr ? intErr.message : "Database corrupted"}`,
          });
        }

        testDb.all("SELECT name FROM sqlite_master WHERE type='table';", (tblErr, tables) => {
          testDb.close();
          if (tblErr) {
            return resolve({
              valid: false,
              message: `Failed to read tables: ${tblErr.message}`,
            });
          }

          const tableNames = (tables || []).map((t) => t.name);
          const required = ["users", "itam", "income", "outgoing"];
          const missing = required.filter((r) => !tableNames.includes(r));

          if (missing.length > 0) {
            return resolve({
              valid: false,
              message: `Backup is missing required system tables: ${missing.join(", ")}`,
              tables: tableNames,
            });
          }

          resolve({
            valid: true,
            message: "Database verified successfully",
            tables: tableNames,
          });
        });
      });
    });
  });
}

/**
 * Safely restores the active database from a backup file with automatic safety snapshot
 */
async function restoreBackup(candidateFilePath) {
  // 1. Verify candidate file
  const validation = await validateBackupFile(candidateFilePath);
  if (!validation.valid) {
    throw new Error(`Backup validation failed: ${validation.message}`);
  }

  // 2. Take automatic pre-restore safety backup of active database
  const safetyBackup = await createBackup({ type: "pre_restore_safety" });

  const activeDbPath = db.getDatabasePath();
  const activeWal = activeDbPath + "-wal";
  const activeShm = activeDbPath + "-shm";

  return new Promise((resolve, reject) => {
    // 3. Flush WAL
    db.run("PRAGMA wal_checkpoint(TRUNCATE)", () => {
      // 4. Close database connection cleanly
      const conn = db.getActiveConnection();
      conn.close((closeErr) => {
        if (closeErr) {
          console.error("Error closing database for restore:", closeErr);
        }

        try {
          // 5. Replace database file
          fs.copyFileSync(candidateFilePath, activeDbPath);

          // 6. Delete old WAL & SHM to prevent replay inconsistencies
          if (fs.existsSync(activeWal)) fs.unlinkSync(activeWal);
          if (fs.existsSync(activeShm)) fs.unlinkSync(activeShm);

          // 7. Reopen database connection via Proxy
          db.reopen((reopenErr) => {
            if (reopenErr) {
              return reject(
                new Error(`Database restored but failed to reopen: ${reopenErr.message}`)
              );
            }

            console.log(`[Backup System] Database restored from ${candidateFilePath}`);
            resolve({
              success: true,
              message: "Database successfully restored and reloaded",
              safetyBackup: safetyBackup.filename,
              tables: validation.tables,
            });
          });
        } catch (copyErr) {
          // If restore failed, try to recover from safety backup
          try {
            fs.copyFileSync(safetyBackup.filepath, activeDbPath);
            db.reopen();
          } catch (recErr) {
            console.error("Critical: Failed to recover from safety backup:", recErr);
          }
          reject(new Error(`Failed to copy backup into active database: ${copyErr.message}`));
        }
      });
    });
  });
}

/**
 * Deletes a backup file safely
 */
function deleteBackup(filename) {
  const safeFilename = path.basename(filename);
  const fullPath = path.join(BACKUP_DIR, safeFilename);

  if (!fs.existsSync(fullPath)) {
    throw new Error("Backup file not found");
  }

  fs.unlinkSync(fullPath);
  return { success: true, deleted: safeFilename };
}

/**
 * Returns overall database and backup system status
 */
function getDatabaseStatus() {
  const config = loadConfig();
  const activeDbPath = db.getDatabasePath();
  let activeDbSize = 0;
  if (fs.existsSync(activeDbPath)) {
    activeDbSize = fs.statSync(activeDbPath).size;
  }

  const allBackups = listBackups();
  const totalBackupBytes = allBackups.reduce((acc, b) => acc + b.size, 0);

  let nextRunTime = null;
  if (config.auto_backup_enabled && config.interval_hours) {
    if (config.last_backup_time) {
      const last = new Date(config.last_backup_time).getTime();
      const nextMs = last + config.interval_hours * 3600 * 1000;
      nextRunTime = new Date(nextMs).toISOString();
    } else {
      nextRunTime = new Date().toISOString(); // Due immediately
    }
  }

  return {
    activeDatabase: {
      path: activeDbPath,
      size: activeDbSize,
      sizeFormatted: formatBytes(activeDbSize),
      walMode: true,
    },
    backupsCount: allBackups.length,
    totalStorageUsed: formatBytes(totalBackupBytes),
    totalStorageBytes: totalBackupBytes,
    config: {
      ...config,
      next_run_time: nextRunTime,
    },
  };
}

let autoBackupTimer = null;

/**
 * Starts automatic scheduled backup loop
 */
function startAutoBackupScheduler() {
  if (autoBackupTimer) clearInterval(autoBackupTimer);

  const checkAndRun = async () => {
    try {
      const config = loadConfig();
      if (!config.auto_backup_enabled) return;

      const now = Date.now();
      const intervalMs = (config.interval_hours || 24) * 3600 * 1000;

      if (!config.last_backup_time) {
        // Never backed up before - create initial backup
        console.log("[Auto-Backup] Creating initial automatic backup...");
        await createBackup({ type: "auto", note: "Initial automatic backup" });
      } else {
        const last = new Date(config.last_backup_time).getTime();
        if (now - last >= intervalMs) {
          console.log("[Auto-Backup] Scheduled interval reached. Creating automatic backup...");
          await createBackup({ type: "auto", note: "Scheduled automatic backup" });
        }
      }
    } catch (err) {
      console.error("[Auto-Backup] Error in scheduled run:", err.message);
    }
  };

  // Run initial check after 5 seconds, then every 10 minutes
  setTimeout(checkAndRun, 5000);
  autoBackupTimer = setInterval(checkAndRun, 10 * 60 * 1000);
  console.log("✓ Automatic Database Backup Scheduler initialized");
}

module.exports = {
  BACKUP_DIR,
  createBackup,
  listBackups,
  validateBackupFile,
  restoreBackup,
  deleteBackup,
  getDatabaseStatus,
  loadConfig,
  saveConfig,
  startAutoBackupScheduler,
};
