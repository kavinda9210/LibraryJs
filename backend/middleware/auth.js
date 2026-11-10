const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "lms_library_central_province_secure_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

function generateToken(payload) {
  return jwt.sign(
    {
      id: payload.id,
      username: payload.username,
      role: payload.role || "user",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Access token required. Please log in." });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token. Please log in again." });
    }
    req.user = decoded;
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: You do not have permission to access this resource.",
      });
    }
    next();
  };
}

const requireAdmin = requireRole("admin");
const requireUserOrAdmin = requireRole("user", "admin");

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireUserOrAdmin,
  JWT_SECRET,
};
