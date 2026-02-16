// backend/income.js
const express = require("express");
const router = express.Router();
const db = require("./db");

/**
 * INCOME ROUTES
 * Mount in server.js:
 *   const incomeRoutes = require("./income");
 *   app.use("/income", incomeRoutes);
 *
 * Endpoints:
 *   GET    /income/                    -> all income records
 *   GET    /income/pending             -> only pending records (admin)
 *   GET    /income/:record_id          -> single record
 *   POST   /income/                    -> add record (approval_status defaults to 'pending')
 *   PUT    /income/:record_id          -> edit record (admin)
 *   PATCH  /income/:record_id/approval -> approve/reject/pending (admin)
 *            - if approved: increase itam.quantity by income.qty (ONLY ONCE)
 *   DELETE /income/:record_id          -> delete record
 */

// ✅ GET all income records
router.get("/", (req, res) => {
  db.all("SELECT * FROM income ORDER BY record_id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET /income error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(rows);
  });
});

// ✅ GET only pending income records (admin approval list)
router.get("/pending", (req, res) => {
  db.all(
    "SELECT * FROM income WHERE approval_status = 'pending' ORDER BY record_id DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("GET /income/pending error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      res.json(rows);
    }
  );
});

// ✅ GET one income record by id
router.get("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.get("SELECT * FROM income WHERE record_id = ?", [record_id], (err, row) => {
    if (err) {
      console.error("GET /income/:id error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    if (!row) return res.status(404).json({ message: "Record not found" });
    res.json(row);
  });
});

// ✅ POST add income record (approval_status default = pending)
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

  if (Number.isNaN(qtyNum) || qtyNum <= 0) {
    return res.status(400).json({ message: "qty must be a positive number" });
  }
  if (Number.isNaN(buyPriceNum) || buyPriceNum < 0) {
    return res.status(400).json({ message: "buy_price must be a valid number" });
  }

  const sql = `
    INSERT INTO income (date, supply_company, bill_number, itam_name, qty, buy_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [date, supply_company, bill_number, itam_name, qtyNum, buyPriceNum],
    function (err) {
      if (err) {
        console.error("POST /income error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      res.status(201).json({
        message: "Income record added (pending approval)",
        record_id: this.lastID,
      });
    }
  );
});

// ✅ PUT edit income record (admin edit)
router.put("/:record_id", (req, res) => {
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
    return res.status(400).json({ message: "qty must be a positive number" });
  }
  if (Number.isNaN(buyPriceNum) || buyPriceNum < 0) {
    return res.status(400).json({ message: "buy_price must be a valid number" });
  }

  const sql = `
    UPDATE income
    SET date = ?, supply_company = ?, bill_number = ?, itam_name = ?, qty = ?, buy_price = ?
    WHERE record_id = ?
  `;

  db.run(
    sql,
    [date, supply_company, bill_number, itam_name, qtyNum, buyPriceNum, record_id],
    function (err) {
      if (err) {
        console.error("PUT /income/:id error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      if (this.changes === 0) return res.status(404).json({ message: "Record not found" });
      res.json({ message: "Income record updated" });
    }
  );
});

// ✅ PATCH approve/reject/pending (admin)
// ✅ If approved -> increase itam.quantity by income.qty (ONLY ONCE)
router.patch("/:record_id/approval", (req, res) => {
  const { record_id } = req.params;
  const { approval_status } = req.body;

  if (!["pending", "approved", "rejected"].includes(approval_status)) {
    return res.status(400).json({ message: "Invalid approval_status" });
  }

  // 1) Read income record first
  db.get("SELECT * FROM income WHERE record_id = ?", [record_id], (err, income) => {
    if (err) {
      console.error("PATCH approval get income error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    if (!income) return res.status(404).json({ message: "Record not found" });

    // Prevent double stock update
    if (income.approval_status === "approved") {
      return res
        .status(400)
        .json({ message: "Already approved. Stock already updated." });
    }

    // 2) Update approval status
    db.run(
      "UPDATE income SET approval_status = ? WHERE record_id = ?",
      [approval_status, record_id],
      function (err) {
        if (err) {
          console.error("PATCH /income/:id/approval update error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }
        if (this.changes === 0) return res.status(404).json({ message: "Record not found" });

        // 3) If approved -> add qty into itam table
        if (approval_status === "approved") {
          db.run(
            "UPDATE itam SET quantity = quantity + ? WHERE itam_name = ?",
            [income.qty, income.itam_name],
            function (err) {
              if (err) {
                console.error("Stock update error:", err.message);
                return res.status(500).json({
                  message: "Approved but failed to update itam quantity",
                });
              }

              if (this.changes === 0) {
                return res.status(404).json({
                  message: "Approved but item not found in itam table",
                });
              }

              return res.json({
                message: "Approved successfully & itam quantity updated",
              });
            }
          );
        } else {
          // rejected or pending: no stock update
          return res.json({ message: "Approval status updated" });
        }
      }
    );
  });
});

// ✅ DELETE income record
router.delete("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.run("DELETE FROM income WHERE record_id = ?", [record_id], function (err) {
    if (err) {
      console.error("DELETE /income/:id error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    if (this.changes === 0) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Income record deleted" });
  });
});
// Add this at the top with other requires
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, "reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// ✅ POST generate PDF report for filtered income records
router.post("/generate-pdf", (req, res) => {
  const { records } = req.body;

  if (!records || records.length === 0) {
    return res.status(400).json({ message: "No records provided" });
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const filename = `income_report_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("INCOME RECORDS REPORT", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
      .text(`Total Records: ${records.length}`, { align: "center" })
      .moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

    // Calculate totals
    const totalQty = records.reduce((sum, r) => sum + r.qty, 0);
    const totalAmount = records.reduce((sum, r) => sum + r.buy_price * r.qty, 0);

    // Summary section
    doc.fontSize(12).font("Helvetica-Bold").text("Summary:", 50, doc.y);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Quantity: ${totalQty}`, 50, doc.y + 5);
    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, 50, doc.y + 5);
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("ID", 50, tableTop);
    doc.text("Date", 80, tableTop);
    doc.text("Company", 140, tableTop, { width: 100 });
    doc.text("Bill#", 250, tableTop);
    doc.text("Item", 300, tableTop, { width: 100 });
    doc.text("Qty", 410, tableTop);
    doc.text("Price", 450, tableTop);
    doc.text("Status", 500, tableTop);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.3);

    // Table rows
    doc.font("Helvetica").fontSize(8);
    let currentY = doc.y;

    records.forEach((record, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      doc.text(record.record_id, 50, currentY);
      doc.text(record.date, 80, currentY);
      doc.text(record.supply_company.substring(0, 15), 140, currentY);
      doc.text(record.bill_number, 250, currentY);
      doc.text(record.itam_name.substring(0, 15), 300, currentY);
      doc.text(record.qty.toString(), 410, currentY);
      doc.text(record.buy_price.toFixed(2), 450, currentY);
      doc.text(record.approval_status, 500, currentY);

      currentY += 20;
    });

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "This is a computer-generated report.",
        50,
        doc.page.height - 50,
        { align: "center" }
      );

    doc.end();

    stream.on("finish", () => {
      res.download(filepath, filename, (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        // Delete file after download
        fs.unlinkSync(filepath);
      });
    });

    stream.on("error", (err) => {
      console.error("Stream error:", err);
      res.status(500).json({ message: "Failed to generate PDF" });
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ message: "Failed to generate PDF" });
  }
});

module.exports = router;
