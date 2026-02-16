const express = require("express");
const router = express.Router();
const db = require("./db"); // db.js is in same folder as auth.js

// POST http://localhost:5000/api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const sql = `
    SELECT id, username, email, contact_number, id_number, address
    FROM users
    WHERE username = ? AND password = ?
  `;

  db.get(sql, [username, password], (err, user) => {
    if (err) {
      console.error("DB error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    return res.json({ message: "Login success", user });
  });
});

module.exports = router;
