/**
 * Standalone CLI script for Windows Task Scheduler / Cron / PM2 to trigger database backups
 * Usage:
 *   node backup-cli.js [--type auto|manual] [--note "your note"]
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const backupService = require("../backupService");

async function main() {
  const args = process.argv.slice(2);
  let type = "auto";
  let note = "Triggered via Windows Task Scheduler / CLI";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--type" && args[i + 1]) {
      type = args[i + 1];
      i++;
    } else if (args[i] === "--note" && args[i + 1]) {
      note = args[i + 1];
      i++;
    }
  }

  const logDir = path.join(backupService.BACKUP_DIR);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, "task_scheduler.log");

  const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    process.stdout.write(line);
    try {
      fs.appendFileSync(logFile, line, "utf8");
    } catch (_) {}
  };

  log(`=== Starting Database Backup (type: ${type}) ===`);

  try {
    const backup = await backupService.createBackup({ type, note });
    log(`✓ SUCCESS: Backup created at ${backup.filepath}`);
    log(`✓ File Name: ${backup.filename}`);
    log(`✓ File Size: ${(backup.size / 1024).toFixed(2)} KB`);
    log(`=== Backup Finished Successfully ===\n`);
    process.exit(0);
  } catch (err) {
    log(`✗ ERROR: Backup failed: ${err.message}`);
    if (err.stack) log(err.stack);
    log(`=== Backup Process Aborted with Error ===\n`);
    process.exit(1);
  }
}

main();
