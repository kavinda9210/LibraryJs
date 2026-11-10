const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { authenticateToken, requireAdmin } = require("./middleware/auth");
const backupService = require("./backupService");

// All backup routes require Admin privileges
router.use(authenticateToken, requireAdmin);

// Multer storage configuration for uploaded backup files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, backupService.BACKUP_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/:/g, "-")
      .split(".")[0];
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `backup_upload_${timestamp}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".sqlite", ".db", ".sql"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .sqlite, .db, and .sql database backup files are permitted."));
    }
  },
});

// GET /api/backup - List backups and current database status
router.get("/", (req, res) => {
  try {
    const backups = backupService.listBackups();
    const status = backupService.getDatabaseStatus();
    res.json({ backups, status });
  } catch (err) {
    console.error("GET /api/backup error:", err);
    res.status(500).json({ error: "Failed to retrieve backup information" });
  }
});

// POST /api/backup/create - Trigger manual backup
router.post("/create", async (req, res) => {
  try {
    const note = req.body.note || "Manual backup created by administrator";
    const backup = await backupService.createBackup({ type: "manual", note });
    res.status(201).json({
      message: "Database backup created successfully",
      backup,
    });
  } catch (err) {
    console.error("POST /api/backup/create error:", err);
    res.status(500).json({ error: `Failed to create backup: ${err.message}` });
  }
});

// GET /api/backup/download/:filename - Download a backup file
router.get("/download/:filename", (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(backupService.BACKUP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup file not found" });
  }

  res.download(filePath, safeFilename, (err) => {
    if (err && !res.headersSent) {
      console.error("Download error:", err);
      res.status(500).json({ error: "Failed to download backup file" });
    }
  });
});

// POST /api/backup/upload - Upload an external backup file to the repository
router.post("/upload", upload.single("backupFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No backup file uploaded" });
  }

  const uploadedPath = req.file.path;
  const safeFilename = req.file.filename;

  try {
    // Validate uploaded file integrity
    const validation = await backupService.validateBackupFile(uploadedPath);
    if (!validation.valid) {
      // Remove invalid file
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
      return res.status(400).json({
        error: `Uploaded file is invalid: ${validation.message}`,
      });
    }

    res.status(201).json({
      message: "Backup file uploaded and verified successfully",
      filename: safeFilename,
      size: req.file.size,
      tables: validation.tables,
    });
  } catch (err) {
    if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
    console.error("POST /api/backup/upload error:", err);
    res.status(500).json({ error: `Upload failed: ${err.message}` });
  }
});

// POST /api/backup/restore/:filename - Restore database from an existing backup in repository
router.post("/restore/:filename", async (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(backupService.BACKUP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Backup file not found" });
  }

  try {
    const result = await backupService.restoreBackup(filePath);
    res.json({
      message: "Database restored successfully",
      result,
    });
  } catch (err) {
    console.error("POST /api/backup/restore error:", err);
    res.status(500).json({ error: `Database restore failed: ${err.message}` });
  }
});

// POST /api/backup/upload-and-restore - Upload and immediately restore database
router.post("/upload-and-restore", upload.single("backupFile"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No backup file uploaded" });
  }

  const uploadedPath = req.file.path;

  try {
    const result = await backupService.restoreBackup(uploadedPath);
    res.json({
      message: "Database restored and verified from uploaded file",
      result,
    });
  } catch (err) {
    console.error("POST /api/backup/upload-and-restore error:", err);
    res.status(500).json({ error: `Upload & restore failed: ${err.message}` });
  }
});

// DELETE /api/backup/:filename - Delete a backup file
router.delete("/:filename", (req, res) => {
  try {
    const result = backupService.deleteBackup(req.params.filename);
    res.json({
      message: "Backup file deleted successfully",
      result,
    });
  } catch (err) {
    console.error("DELETE /api/backup error:", err);
    res.status(err.message.includes("not found") ? 404 : 500).json({
      error: err.message,
    });
  }
});

// POST /api/backup/config - Update automatic backup schedule settings
router.post("/config", (req, res) => {
  try {
    const { auto_backup_enabled, interval_hours, max_retention_copies } = req.body;
    const current = backupService.loadConfig();

    if (auto_backup_enabled !== undefined) {
      current.auto_backup_enabled = Boolean(auto_backup_enabled);
    }

    if (interval_hours !== undefined) {
      const hours = Number(interval_hours);
      if (Number.isNaN(hours) || hours < 1 || hours > 720) {
        return res.status(400).json({ error: "Interval hours must be between 1 and 720" });
      }
      current.interval_hours = hours;
    }

    if (max_retention_copies !== undefined) {
      const max = Number(max_retention_copies);
      if (Number.isNaN(max) || max < 1 || max > 500) {
        return res.status(400).json({ error: "Retention copies must be between 1 and 500" });
      }
      current.max_retention_copies = max;
    }

    backupService.saveConfig(current);
    res.json({
      message: "Backup configuration updated successfully",
      config: current,
    });
  } catch (err) {
    console.error("POST /api/backup/config error:", err);
    res.status(500).json({ error: "Failed to update backup settings" });
  }
});

module.exports = router;
