const express = require("express");
const router = express.Router();
const db = require("./db");
const { authenticateToken, requireUserOrAdmin } = require("./middleware/auth");

// All item routes require authentication
router.use(authenticateToken, requireUserOrAdmin);

// Get all items
router.get("/", (req, res) => {
  db.all("SELECT * FROM itam ORDER BY itam_id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET /itam error:", err.message);
      return res.status(500).json({ error: "Failed to fetch items" });
    }
    res.json(rows);
  });
});

// Get single item by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM itam WHERE itam_id = ?", [id], (err, row) => {
    if (err) {
      console.error("GET /itam/:id error:", err.message);
      return res.status(500).json({ error: "Failed to fetch item" });
    }
    if (!row) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(row);
  });
});

// Add item
router.post("/", (req, res) => {
  const { itam_no, itam_name, price_per_one, buy_price, quantity } = req.body;

  if (!itam_no || !itam_name || price_per_one == null || quantity == null) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const priceNum = Number(price_per_one);
  const buyNum = buy_price != null ? Number(buy_price) : 0;
  const qtyNum = Number(quantity);

  if (Number.isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: "Selling price must be a valid non-negative number" });
  }

  if (Number.isNaN(buyNum) || buyNum < 0) {
    return res.status(400).json({ error: "Cost/buy price must be a valid non-negative number" });
  }

  if (Number.isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
    return res.status(400).json({ error: "Quantity must be a non-negative integer" });
  }

  const cleanNo = String(itam_no).trim();
  const cleanName = String(itam_name).trim();

  db.run(
    `INSERT INTO itam (itam_no, itam_name, price_per_one, buy_price, quantity) VALUES (?, ?, ?, ?, ?)`,
    [cleanNo, cleanName, priceNum, buyNum, qtyNum],
    function (err) {
      if (err) {
        console.error("POST /itam error:", err.message);
        if (err.message && (err.message.includes("UNIQUE") || err.message.includes("constraint failed"))) {
          return res.status(409).json({ error: "An item with this name already exists" });
        }
        return res.status(500).json({ error: "Failed to create item" });
      }
      res.status(201).json({
        message: "Item created successfully",
        itam_id: this.lastID,
        data: {
          itam_id: this.lastID,
          itam_no: cleanNo,
          itam_name: cleanName,
          price_per_one: priceNum,
          buy_price: buyNum,
          quantity: qtyNum,
        },
      });
    }
  );
});

// Update item
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { itam_no, itam_name, price_per_one, buy_price, quantity } = req.body;

  if (!itam_no || !itam_name || price_per_one == null || quantity == null) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const priceNum = Number(price_per_one);
  const buyNum = buy_price != null ? Number(buy_price) : 0;
  const qtyNum = Number(quantity);

  if (Number.isNaN(priceNum) || priceNum < 0) {
    return res.status(400).json({ error: "Selling price must be a valid non-negative number" });
  }

  if (Number.isNaN(buyNum) || buyNum < 0) {
    return res.status(400).json({ error: "Cost/buy price must be a valid non-negative number" });
  }

  if (Number.isNaN(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
    return res.status(400).json({ error: "Quantity must be a non-negative integer" });
  }

  const cleanNo = String(itam_no).trim();
  const cleanName = String(itam_name).trim();

  db.run(
    `UPDATE itam SET itam_no = ?, itam_name = ?, price_per_one = ?, buy_price = ?, quantity = ? WHERE itam_id = ?`,
    [cleanNo, cleanName, priceNum, buyNum, qtyNum, id],
    function (err) {
      if (err) {
        console.error("PUT /itam/:id error:", err.message);
        if (err.message && (err.message.includes("UNIQUE") || err.message.includes("constraint failed"))) {
          return res.status(409).json({ error: "An item with this name already exists" });
        }
        return res.status(500).json({ error: "Failed to update item" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json({
        message: "Item updated successfully",
        updated: this.changes,
        data: {
          itam_id: parseInt(id, 10),
          itam_no: cleanNo,
          itam_name: cleanName,
          price_per_one: priceNum,
          buy_price: buyNum,
          quantity: qtyNum,
        },
      });
    }
  );
});

// Delete item
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM itam WHERE itam_id = ?`, [id], function (err) {
    if (err) {
      console.error("DELETE /itam/:id error:", err.message);
      return res.status(500).json({ error: "Failed to delete item" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json({ message: "Item deleted successfully", deleted: this.changes });
  });
});

module.exports = router;
