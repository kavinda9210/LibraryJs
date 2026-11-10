const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const db = require("./db");
const { authenticateToken, requireAdmin, requireUserOrAdmin } = require("./middleware/auth");

// All income routes require authentication
router.use(authenticateToken);

// GET all income records
router.get("/", (req, res) => {
  db.all("SELECT * FROM income ORDER BY record_id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET /income error:", err.message);
      return res.status(500).json({ message: "Server error fetching income records" });
    }
    res.json(rows);
  });
});

// GET only pending income records (for admin approval list)
router.get("/pending", (req, res) => {
  db.all(
    "SELECT * FROM income WHERE approval_status = 'pending' ORDER BY record_id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("GET /income/pending error:", err.message);
        return res.status(500).json({ message: "Server error fetching pending records" });
      }
      res.json(rows);
    }
  );
});

// GET one income record by id
router.get("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.get("SELECT * FROM income WHERE record_id = ?", [record_id], (err, row) => {
    if (err) {
      console.error("GET /income/:id error:", err.message);
      return res.status(500).json({ message: "Server error fetching record" });
    }
    if (!row) {
      return res.status(404).json({ message: "Income record not found" });
    }
    res.json(row);
  });
});

// POST add income record (approval_status default = pending)
router.post("/", (req, res) => {
  const { date, supply_company, bill_number, itam_name, qty, buy_price } = req.body;

  if (
    !date ||
    !supply_company ||
    !bill_number ||
    !itam_name ||
    qty == null ||
    buy_price == null
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const qtyNum = Number(qty);
  const buyPriceNum = Number(buy_price);

  if (Number.isNaN(qtyNum) || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
    return res.status(400).json({ message: "Quantity must be a positive whole number" });
  }
  if (Number.isNaN(buyPriceNum) || buyPriceNum < 0) {
    return res.status(400).json({ message: "Buy price must be a valid non-negative number" });
  }

  const sql = `
    INSERT INTO income (date, supply_company, bill_number, itam_name, qty, buy_price, approval_status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.run(
    sql,
    [
      String(date).trim(),
      String(supply_company).trim(),
      String(bill_number).trim(),
      String(itam_name).trim(),
      qtyNum,
      buyPriceNum,
    ],
    function (err) {
      if (err) {
        console.error("POST /income error:", err.message);
        return res.status(500).json({ message: "Server error creating income record" });
      }
      res.status(201).json({
        message: "Income record added (pending approval)",
        record_id: this.lastID,
      });
    }
  );
});

// PUT edit income record (admin only)
router.put("/:record_id", requireAdmin, (req, res) => {
  const { record_id } = req.params;
  const { date, supply_company, bill_number, itam_name, qty, buy_price } = req.body;

  if (
    !date ||
    !supply_company ||
    !bill_number ||
    !itam_name ||
    qty == null ||
    buy_price == null
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const qtyNum = Number(qty);
  const buyPriceNum = Number(buy_price);

  if (Number.isNaN(qtyNum) || qtyNum <= 0) {
    return res.status(400).json({ message: "Quantity must be a positive number" });
  }
  if (Number.isNaN(buyPriceNum) || buyPriceNum < 0) {
    return res.status(400).json({ message: "Buy price must be a valid number" });
  }

  const sql = `
    UPDATE income
    SET date = ?, supply_company = ?, bill_number = ?, itam_name = ?, qty = ?, buy_price = ?
    WHERE record_id = ?
  `;

  db.run(
    sql,
    [
      String(date).trim(),
      String(supply_company).trim(),
      String(bill_number).trim(),
      String(itam_name).trim(),
      qtyNum,
      buyPriceNum,
      record_id,
    ],
    function (err) {
      if (err) {
        console.error("PUT /income/:id error:", err.message);
        return res.status(500).json({ message: "Server error updating record" });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Income record not found" });
      }
      res.json({ message: "Income record updated successfully" });
    }
  );
});

// PATCH approve/reject/pending (admin only) - ATOMIC TRANSACTION
router.patch("/:record_id/approval", requireAdmin, (req, res) => {
  const { record_id } = req.params;
  const { approval_status } = req.body;

  if (!["pending", "approved", "rejected"].includes(approval_status)) {
    return res.status(400).json({ message: "Invalid approval status" });
  }

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION", (transErr) => {
      if (transErr) {
        console.error("Transaction start error:", transErr);
        return res.status(500).json({ message: "Failed to start database transaction" });
      }

      const rollback = (statusCode, msg) => {
        db.run("ROLLBACK", () => {
          res.status(statusCode).json({ message: msg });
        });
      };

      // 1. Fetch current income record
      db.get("SELECT * FROM income WHERE record_id = ?", [record_id], (err, income) => {
        if (err) return rollback(500, "Server error checking income record");
        if (!income) return rollback(404, "Income record not found");

        if (income.approval_status === "approved" && approval_status === "approved") {
          return rollback(400, "Record is already approved and stock has already been updated.");
        }

        // 2. If approving, check if item exists in itam table
        if (approval_status === "approved") {
          db.get("SELECT * FROM itam WHERE itam_name = ?", [income.itam_name], (itemErr, itamRow) => {
            if (itemErr) return rollback(500, "Database error checking item");
            if (!itamRow) {
              return rollback(404, `Item "${income.itam_name}" not found in inventory table`);
            }

            // Update item stock and latest unit buy price
            db.run(
              "UPDATE itam SET quantity = quantity + ?, buy_price = ? WHERE itam_name = ?",
              [income.qty, income.buy_price, income.itam_name],
              (updateItemErr) => {
                if (updateItemErr) return rollback(500, "Failed to update item stock quantity");

                // Update approval status
                db.run(
                  "UPDATE income SET approval_status = 'approved' WHERE record_id = ?",
                  [record_id],
                  (updateIncErr) => {
                    if (updateIncErr) return rollback(500, "Failed to update approval status");

                    db.run("COMMIT", (commitErr) => {
                      if (commitErr) return rollback(500, "Commit failed");
                      res.json({
                        message: "Approved successfully and inventory quantity updated",
                      });
                    });
                  }
                );
              }
            );
          });
        } else {
          // Rejecting or resetting to pending (no stock modification)
          db.run(
            "UPDATE income SET approval_status = ? WHERE record_id = ?",
            [approval_status, record_id],
            (updateErr) => {
              if (updateErr) return rollback(500, "Failed to update approval status");
              db.run("COMMIT", (commitErr) => {
                if (commitErr) return rollback(500, "Commit failed");
                res.json({ message: `Status updated to ${approval_status}` });
              });
            }
          );
        }
      });
    });
  });
});

// DELETE income record - ATOMIC TRANSACTION with stock reversal if approved
router.delete("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION", (transErr) => {
      if (transErr) return res.status(500).json({ message: "Failed to start database transaction" });

      const rollback = (status, msg) => {
        db.run("ROLLBACK", () => res.status(status).json({ message: msg }));
      };

      db.get("SELECT * FROM income WHERE record_id = ?", [record_id], (err, income) => {
        if (err) return rollback(500, "Server error checking income record");
        if (!income) return rollback(404, "Income record not found");

        if (income.approval_status === "approved") {
          // Check stock before rolling back
          db.get("SELECT quantity FROM itam WHERE itam_name = ?", [income.itam_name], (stockErr, itamRow) => {
            if (stockErr) return rollback(500, "Server error checking inventory");
            if (itamRow && itamRow.quantity < income.qty) {
              return rollback(400, "Cannot delete approved record: remaining stock is less than incoming quantity.");
            }

            // Deduct stock
            db.run(
              "UPDATE itam SET quantity = quantity - ? WHERE itam_name = ?",
              [income.qty, income.itam_name],
              (deductErr) => {
                if (deductErr) return rollback(500, "Failed to revert inventory stock");

                db.run("DELETE FROM income WHERE record_id = ?", [record_id], (delErr) => {
                  if (delErr) return rollback(500, "Failed to delete income record");
                  db.run("COMMIT", (cErr) => {
                    if (cErr) return rollback(500, "Transaction commit failed");
                    res.json({ message: "Approved income record deleted and stock reversed" });
                  });
                });
              }
            );
          });
        } else {
          // Unapproved, just delete
          db.run("DELETE FROM income WHERE record_id = ?", [record_id], (delErr) => {
            if (delErr) return rollback(500, "Failed to delete income record");
            db.run("COMMIT", (cErr) => {
              if (cErr) return rollback(500, "Transaction commit failed");
              res.json({ message: "Income record deleted successfully" });
            });
          });
        }
      });
    });
  });
});

// POST generate PDF report - Stream directly without file leaks
router.post("/generate-pdf", (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "No records provided for report generation" });
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="income_report_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#1565C0")
      .text("INCOME RECORDS REPORT", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text("Library Service Board - Central Province", { align: "center" })
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
      .text(`Total Records: ${records.length}`, { align: "center" })
      .moveDown(1);

    // Divider
    doc.strokeColor("#2196F3").lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

    // Totals
    const totalQty = records.reduce((sum, r) => sum + (Number(r?.qty) || 0), 0);
    const totalAmount = records.reduce((sum, r) => sum + ((Number(r?.buy_price) || 0) * (Number(r?.qty) || 0)), 0);

    // Summary box
    const summaryY = doc.y;
    doc.fillColor("#E3F2FD").rect(50, summaryY, 500, 35).fill();
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1565C0");
    doc.text(`Total Quantity: ${totalQty}`, 65, summaryY + 12);
    doc.text(`Total Cost: Rs. ${totalAmount.toFixed(2)}`, 300, summaryY + 12);
    doc.moveDown(2);

    // Table Header
    const tableTop = doc.y + 10;
    doc.fillColor("#1976D2").rect(50, tableTop - 4, 500, 18).fill();
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("ID", 55, tableTop);
    doc.text("Date", 85, tableTop);
    doc.text("Supplier", 145, tableTop, { width: 110 });
    doc.text("Bill#", 260, tableTop);
    doc.text("Item Name", 320, tableTop, { width: 100 });
    doc.text("Qty", 425, tableTop);
    doc.text("Buy Price", 460, tableTop);
    doc.text("Status", 515, tableTop);

    let currentY = tableTop + 18;
    doc.font("Helvetica").fontSize(8).fillColor("#333333");

    records.forEach((record, index) => {
      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }

      if (index % 2 === 0) {
        doc.fillColor("#F8F9FA").rect(50, currentY - 2, 500, 16).fill();
      }

      doc.fillColor("#333333");
      doc.text(String(record?.record_id ?? ""), 55, currentY);
      doc.text(String(record?.date ?? ""), 85, currentY);
      doc.text(String(record?.supply_company ?? "").substring(0, 20), 145, currentY);
      doc.text(String(record?.bill_number ?? ""), 260, currentY);
      doc.text(String(record?.itam_name ?? "").substring(0, 18), 320, currentY);
      doc.text(String(record?.qty ?? 0), 425, currentY);
      doc.text(`Rs. ${(Number(record?.buy_price) || 0).toFixed(2)}`, 460, currentY);

      const status = String(record?.approval_status ?? "pending");
      if (status === "approved") doc.fillColor("#2E7D32");
      else if (status === "rejected") doc.fillColor("#C62828");
      else doc.fillColor("#E65100");
      doc.text(status, 515, currentY);

      currentY += 18;
    });

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#777777")
      .text("Library Service Board - Central Province | Computer-generated report", 50, doc.page.height - 40, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("PDF generation error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  }
});

module.exports = router;
