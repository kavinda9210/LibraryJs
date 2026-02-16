const express = require("express");
const router = express.Router();
const db = require("./db");

// Get all items
router.get("/", (req, res) => {
  db.all("SELECT * FROM itam", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get single item
router.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM itam WHERE itam_id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Add item
router.post("/", (req, res) => {
  const { itam_no, itam_name, price_per_one, quantity } = req.body;
  db.run(
    `INSERT INTO itam (itam_no, itam_name, price_per_one, quantity) VALUES (?, ?, ?, ?)`,
    [itam_no, itam_name, price_per_one, quantity],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ itam_id: this.lastID });
    }
  );
});

// Update item
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { itam_no, itam_name, price_per_one, quantity } = req.body;
  db.run(
    `UPDATE itam SET itam_no=?, itam_name=?, price_per_one=?, quantity=? WHERE itam_id=?`,
    [itam_no, itam_name, price_per_one, quantity, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete item
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM itam WHERE itam_id=?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;