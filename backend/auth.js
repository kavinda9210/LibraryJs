const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("./db");
const { generateToken, authenticateToken } = require("./middleware/auth");

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const sql = `
    SELECT id, username, email, password, contact_number, id_number, address, role
    FROM users
    WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)
  `;

  db.get(sql, [username.trim(), username.trim()], (err, user) => {
    if (err) {
      console.error("DB error during login:", err.message);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Verify password via bcrypt or fallback plaintext migration
    let passwordMatches = false;
    if (user.password.startsWith("$2")) {
      passwordMatches = bcrypt.compareSync(password, user.password);
    } else {
      passwordMatches = (user.password === password);
      // Auto-migrate to bcrypt hash if plain match
      if (passwordMatches) {
        const hashed = bcrypt.hashSync(password, 10);
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashed, user.id]);
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const role = user.role || "user";
    const token = generateToken({ id: user.id, username: user.username, role });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contact_number,
      id_number: user.id_number,
      address: user.address,
      role,
    };

    return res.json({
      message: "Login success",
      token,
      user: safeUser,
    });
  });
});

// GET /api/auth/me - Validate token and get current user profile
router.get("/me", authenticateToken, (req, res) => {
  const sql = `
    SELECT id, username, email, contact_number, id_number, address, role
    FROM users
    WHERE id = ?
  `;

  db.get(sql, [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch user profile" });
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  });
});

module.exports = router;
