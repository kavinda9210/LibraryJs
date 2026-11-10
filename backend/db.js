const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "LMSDB.sqlite");

function initSchema(targetDb) {
  targetDb.serialize(() => {
    targetDb.run("PRAGMA journal_mode = WAL;");
    targetDb.run("PRAGMA foreign_keys = ON;");

    /* =========================
       USERS TABLE
    ========================= */
    targetDb.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      contact_number TEXT,
      id_number TEXT,
      address TEXT,
      role TEXT NOT NULL DEFAULT 'user'
    )`);

    targetDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    targetDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    /* =========================
       ITAM TABLE
    ========================= */
    targetDb.run(`CREATE TABLE IF NOT EXISTS itam (
      itam_id INTEGER PRIMARY KEY AUTOINCREMENT,
      itam_no TEXT NOT NULL,
      itam_name TEXT NOT NULL,
      price_per_one REAL NOT NULL,
      buy_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 0
    )`);

    // Auto-migration: ensure buy_price column exists on older tables
    targetDb.all("PRAGMA table_info(itam)", (err, cols) => {
      if (!err && cols && !cols.some((c) => c.name === "buy_price")) {
        targetDb.run("ALTER TABLE itam ADD COLUMN buy_price REAL NOT NULL DEFAULT 0");
      }
    });

    targetDb.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_itam_name ON itam(itam_name)`);

    /* =========================
       INCOME TABLE (Stock In)
    ========================= */
    targetDb.run(`CREATE TABLE IF NOT EXISTS income (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      supply_company TEXT NOT NULL,
      bill_number TEXT NOT NULL,
      itam_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      buy_price REAL NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'pending'
    )`);

    /* =========================
       OUTGOING TABLE (Stock Out / Sales)
    ========================= */
    targetDb.run(`CREATE TABLE IF NOT EXISTS outgoing (
      record_id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      buy_company TEXT NOT NULL,
      bill_number TEXT NOT NULL,
      itam_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      balance INTEGER NOT NULL,
      sell_price REAL NOT NULL,
      buy_price REAL NOT NULL,
      profit REAL NOT NULL
    )`);
  });
}

function openDatabase() {
  const newDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Database connection error:", err.message);
    } else {
      console.log(`Connected to LMSDB SQLite database at ${dbPath}`);
    }
  });
  initSchema(newDb);
  return newDb;
}

let activeDb = openDatabase();

const dbProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === "getDatabasePath") {
      return () => dbPath;
    }
    if (prop === "getActiveConnection") {
      return () => activeDb;
    }
    if (prop === "reopen") {
      return (callback) => {
        activeDb.close((closeErr) => {
          if (closeErr) {
            console.error("Error closing active DB during reopen:", closeErr);
            if (callback) return callback(closeErr);
            return;
          }
          activeDb = openDatabase();
          if (callback) callback(null);
        });
      };
    }
    const val = activeDb[prop];
    return typeof val === "function" ? val.bind(activeDb) : val;
  },
  set(target, prop, value) {
    activeDb[prop] = value;
    return true;
  },
});

module.exports = dbProxy;
