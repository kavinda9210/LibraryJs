const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("./db");
const { authenticateToken, requireAdmin } = require("./middleware/auth");

// All user management routes require admin access
router.use(authenticateToken, requireAdmin);

// Get all users
router.get("/", (req, res) => {
  const sql = `
    SELECT id, username, email, contact_number, id_number, address, role 
    FROM users 
    ORDER BY id ASC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

// Get single user by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT id, username, email, contact_number, id_number, address, role 
    FROM users 
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
    if (!row) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(row);
  });
});

// Create user
router.post("/", (req, res) => {
  const { username, email, password, contact_number, id_number, address, role } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Username, email, and password are required" });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role === "admin" ? "admin" : "user";
  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `
    INSERT INTO users (username, email, password, contact_number, id_number, address, role) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      cleanUsername,
      cleanEmail,
      hashedPassword,
      contact_number ? contact_number.trim() : null,
      id_number ? id_number.trim() : null,
      address ? address.trim() : null,
      cleanRole,
    ],
    function (err) {
      if (err) {
        console.error("Error creating user:", err);
        if (err.message && (err.message.includes("UNIQUE") || err.message.includes("constraint failed"))) {
          return res.status(409).json({ error: "Username or email already exists" });
        }
        return res.status(500).json({ error: "Failed to create user" });
      }

      res.status(201).json({
        message: "User created successfully",
        id: this.lastID,
        data: {
          id: this.lastID,
          username: cleanUsername,
          email: cleanEmail,
          contact_number: contact_number || null,
          id_number: id_number || null,
          address: address || null,
          role: cleanRole,
        },
      });
    }
  );
});

// Update user
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { username, email, password, contact_number, id_number, address, role } = req.body;

  // Validation
  if (!username || !email) {
    return res.status(400).json({ error: "Username and email are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanRole = role === "admin" ? "admin" : "user";

  let query;
  let params;

  if (password && password.trim() !== "") {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query = `
      UPDATE users 
      SET username = ?, email = ?, password = ?, contact_number = ?, id_number = ?, address = ?, role = ? 
      WHERE id = ?
    `;
    params = [
      cleanUsername,
      cleanEmail,
      hashedPassword,
      contact_number ? contact_number.trim() : null,
      id_number ? id_number.trim() : null,
      address ? address.trim() : null,
      cleanRole,
      id,
    ];
  } else {
    query = `
      UPDATE users 
      SET username = ?, email = ?, contact_number = ?, id_number = ?, address = ?, role = ? 
      WHERE id = ?
    `;
    params = [
      cleanUsername,
      cleanEmail,
      contact_number ? contact_number.trim() : null,
      id_number ? id_number.trim() : null,
      address ? address.trim() : null,
      cleanRole,
      id,
    ];
  }

  db.run(query, params, function (err) {
    if (err) {
      console.error("Error updating user:", err);
      if (err.message && (err.message.includes("UNIQUE") || err.message.includes("constraint failed"))) {
        return res.status(409).json({ error: "Username or email already exists" });
      }
      return res.status(500).json({ error: "Failed to update user" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      data: {
        id: parseInt(id, 10),
        username: cleanUsername,
        email: cleanEmail,
        contact_number,
        id_number,
        address,
        role: cleanRole,
      },
    });
  });
});

// Delete user
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user && String(req.user.id) === String(id)) {
    return res.status(400).json({ error: "You cannot delete your own account while logged in" });
  }

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting user:", err);
      return res.status(500).json({ error: "Failed to delete user" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      message: "User deleted successfully",
      id: parseInt(id, 10),
    });
  });
});

module.exports = router;
