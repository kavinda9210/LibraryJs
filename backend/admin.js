const express = require("express");
const router = express.Router();

// Hardcoded admin credentials
const ADMIN_USERNAME = "lsbcp";
const ADMIN_PASSWORD = "admin123";

// Admin login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, message: "Admin login successful" });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

module.exports = router;
