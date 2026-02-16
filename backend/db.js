const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./LMSDB.sqlite", (err) => {
  if (err) console.error(err.message);
  else console.log("Connected to LMSDB SQLite database");
});

/* =========================
   USERS TABLE
========================= */
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  contact_number TEXT,
  id_number TEXT,
  address TEXT
)`);

/* =========================
   ITAM TABLE
========================= */
db.run(`CREATE TABLE IF NOT EXISTS itam (
  itam_id INTEGER PRIMARY KEY AUTOINCREMENT,
  itam_no TEXT NOT NULL,
  itam_name TEXT NOT NULL,
  price_per_one REAL NOT NULL,
  quantity INTEGER NOT NULL
)`);

/* =========================
   INCOME TABLE (Stock In)
   - approval default: 'pending'
   - record_id is primary key
========================= */
db.run(`CREATE TABLE IF NOT EXISTS income (
  record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                 -- store as 'YYYY-MM-DD'
  supply_company TEXT NOT NULL,
  bill_number TEXT NOT NULL,
  itam_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  buy_price REAL NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending'
)`);

/* =========================
   OUTGOING TABLE (Stock Out / Sales)
   - record_id is primary key
   - balance: remaining stock after outgoing (you can update itam.quantity too)
   - profit can be stored OR calculated (sell_price - buy_price) * qty
========================= */
db.run(`CREATE TABLE IF NOT EXISTS outgoing (
  record_id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                 -- store as 'YYYY-MM-DD'
  buy_company TEXT NOT NULL,          -- customer/company buying from you
  bill_number TEXT NOT NULL,
  itam_name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  sell_price REAL NOT NULL,
  buy_price REAL NOT NULL,
  profit REAL NOT NULL
)`);

module.exports = db;
