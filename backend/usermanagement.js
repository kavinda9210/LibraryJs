// usermanagement.js
const express = require("express");
const router = express.Router();
const db = require("./db");

// Get all users
router.get("/", (req, res) => {
  db.all("SELECT id, username, email, contact_number, id_number, address FROM users", [], (err, rows) => {
    if (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ error: "Failed to fetch users" });
      return;
    }
    res.json(rows);
  });
});

// Get single user by ID
router.get("/:id", (req, res) => {
  const id = req.params.id;
  
  db.get("SELECT id, username, email, contact_number, id_number, address FROM users WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({ error: "Failed to fetch user" });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(row);
  });
});

// Create user
router.post("/", (req, res) => {
  const { username, email, password, contact_number, id_number, address } = req.body;
  
  // Validation
  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }
  
  db.run(
    `INSERT INTO users (username, email, password, contact_number, id_number, address) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      username.trim(), 
      email.trim().toLowerCase(), 
      password, 
      contact_number ? contact_number.trim() : null, 
      id_number ? id_number.trim() : null, 
      address ? address.trim() : null
    ],
    function (err) {
      if (err) {
        console.error("Error creating user:", err);
        if (err.message.includes("UNIQUE")) {
          res.status(409).json({ error: "Username or email already exists" });
        } else {
          res.status(500).json({ error: "Failed to create user" });
        }
        return;
      }
      res.status(201).json({
        message: "User created successfully",
        id: this.lastID,
        data: {
          id: this.lastID,
          username: username.trim(),
          email: email.trim().toLowerCase(),
          contact_number,
          id_number,
          address
        }
      });
    }
  );
});

// Update user
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const { username, email, password, contact_number, id_number, address } = req.body;
  
  // Validation
  if (!username || !email) {
    res.status(400).json({ error: "Username and email are required" });
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }
  
  // Build query based on whether password is provided
  let query, params;
  if (password && password.trim() !== "") {
    query = `UPDATE users 
             SET username = ?, email = ?, password = ?, contact_number = ?, id_number = ?, address = ? 
             WHERE id = ?`;
    params = [
      username.trim(), 
      email.trim().toLowerCase(), 
      password, 
      contact_number ? contact_number.trim() : null, 
      id_number ? id_number.trim() : null, 
      address ? address.trim() : null, 
      id
    ];
  } else {
    query = `UPDATE users 
             SET username = ?, email = ?, contact_number = ?, id_number = ?, address = ? 
             WHERE id = ?`;
    params = [
      username.trim(), 
      email.trim().toLowerCase(), 
      contact_number ? contact_number.trim() : null, 
      id_number ? id_number.trim() : null, 
      address ? address.trim() : null, 
      id
    ];
  }
  
  db.run(query, params, function (err) {
    if (err) {
      console.error("Error updating user:", err);
      if (err.message.includes("UNIQUE")) {
        res.status(409).json({ error: "Username or email already exists" });
      } else {
        res.status(500).json({ error: "Failed to update user" });
      }
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      message: "User updated successfully",
      data: { 
        id: parseInt(id), 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        contact_number, 
        id_number, 
        address 
      }
    });
  });
});

// Delete user
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ error: "Failed to delete user" });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      message: "User deleted successfully",
      id: parseInt(id)
    });
  });
});

module.exports = router;