require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const adminRoute = require("./admin");
const userManagementRoute = require("./usermanagement");
const itamRoutes = require("./itam");
const authRoutes = require("./auth");
const incomeRoutes = require("./income");
const outgoingRoutes = require("./outgoing");
const backupRoutes = require("./backup");
const backupService = require("./backupService");

const app = express();
const PORT = process.env.PORT || 5000;

// Security & CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, Postman)
      if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: origin not allowed"), false);
    },
    credentials: true,
  })
);

app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

// Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Library Income & Outgoing Management System",
  });
});

// Application Routes
app.use("/admin", adminRoute);
app.use("/users", userManagementRoute);
app.use("/itam", itamRoutes);
app.use("/api/auth", authRoutes);
app.use("/income", incomeRoutes);
app.use("/outgoing", outgoingRoutes);
app.use("/api/backup", backupRoutes);
app.use("/backup", backupRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Application Error:", err.stack || err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    error: err.message || "Internal server error occurred",
  });
});

// Start listening if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✓ Server running at http://localhost:${PORT}`);
    console.log(`✓ Auth routes loaded at /api/auth`);
    console.log(`✓ Backup routes loaded at /api/backup`);
    backupService.startAutoBackupScheduler();
  });
}

module.exports = app;
