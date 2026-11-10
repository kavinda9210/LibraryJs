const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const db = require("./db");
const { generateToken } = require("./middleware/auth");

const ENV_ADMIN_USER = process.env.ADMIN_USERNAME || "lsbcp";
const ENV_ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

// Admin login route
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const cleanUser = username.trim();

  // First check database for user with admin role
  const sql = `
    SELECT id, username, email, password, role 
    FROM users 
    WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND role = 'admin'
  `;

  db.get(sql, [cleanUser, cleanUser], (err, dbAdmin) => {
    if (err) {
      console.error("DB error in admin login:", err);
    }

    if (dbAdmin) {
      let isMatch = false;
      if (dbAdmin.password.startsWith("$2")) {
        isMatch = bcrypt.compareSync(password, dbAdmin.password);
      } else {
        isMatch = (dbAdmin.password === password);
      }

      if (isMatch) {
        const token = generateToken({
          id: dbAdmin.id,
          username: dbAdmin.username,
          role: "admin",
        });

        return res.json({
          success: true,
          message: "Admin login successful",
          token,
          admin: {
            id: dbAdmin.id,
            username: dbAdmin.username,
            role: "admin",
          },
        });
      }
    }

    // Fallback: Check environment-configured admin
    if (cleanUser.toLowerCase() === ENV_ADMIN_USER.toLowerCase() && password === ENV_ADMIN_PASS) {
      const token = generateToken({
        id: 1,
        username: ENV_ADMIN_USER,
        role: "admin",
      });

      return res.json({
        success: true,
        message: "Admin login successful",
        token,
        admin: {
          id: 1,
          username: ENV_ADMIN_USER,
          role: "admin",
        },
      });
    }

    return res.status(401).json({ success: false, message: "Invalid administrator credentials" });
  });
});

module.exports = router;
