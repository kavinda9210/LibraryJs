const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const db = require("./db");
const { authenticateToken, requireUserOrAdmin } = require("./middleware/auth");

// All outgoing routes require authentication
router.use(authenticateToken, requireUserOrAdmin);

// Helper function to build PDF invoice
function buildInvoiceStream(billData, outputStream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(outputStream);

  // Header
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor("#1565C0")
    .text("SALES INVOICE", { align: "center" })
    .moveDown(0.3);

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor("#1976D2")
    .text("Library Service Board - Central Province", { align: "center" })
    .moveDown(0.2);

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor("#444444")
    .text("Gatambe, Peradeniya | Tel: 0812384032 | Email: libraryserviceboardcpc@gmail.com", { align: "center" })
    .moveDown(1);

  doc.strokeColor("#2196F3").lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

  // Bill metadata
  const leftCol = 50;
  const rightCol = 320;
  const infoY = doc.y;

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#1565C0").text("Bill To:", leftCol, infoY);
  doc.font("Helvetica").fillColor("#333333").text(billData.buy_company || "Customer", leftCol, infoY + 15);

  doc.font("Helvetica-Bold").fillColor("#1565C0").text("Bill Number:", rightCol, infoY);
  doc.font("Helvetica").fillColor("#333333").text(billData.bill_number, rightCol + 85, infoY);

  doc.font("Helvetica-Bold").fillColor("#1565C0").text("Date:", rightCol, infoY + 15);
  doc.font("Helvetica").fillColor("#333333").text(billData.date, rightCol + 85, infoY + 15);

  doc.moveDown(3);

  // Table Header
  const tableTop = doc.y + 10;
  doc.fillColor("#E3F2FD").rect(50, tableTop - 4, 500, 20).fill();
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#1565C0");
  doc.text("Item Name", 60, tableTop);
  doc.text("Qty", 250, tableTop);
  doc.text("Unit Price (Rs.)", 320, tableTop);
  doc.text("Amount (Rs.)", 450, tableTop);

  doc.strokeColor("#BBDEFB").lineWidth(1).moveTo(50, tableTop + 18).lineTo(550, tableTop + 18).stroke();

  // Items
  let totalAmount = 0;
  let currentY = tableTop + 24;
  doc.font("Helvetica").fontSize(9);

  (billData.items || []).forEach((item, index) => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    const qty = Number(item.qty) || 0;
    const sellTotal = Number(item.sell_price) || 0;
    const unitPrice = qty > 0 ? (sellTotal / qty) : 0;
    totalAmount += sellTotal;

    if (index % 2 === 0) {
      doc.fillColor("#F9F9F9").rect(50, currentY - 2, 500, 18).fill();
    }

    doc.fillColor("#333333");
    doc.text(String(item.itam_name).substring(0, 30), 60, currentY, { width: 180 });
    doc.text(qty.toString(), 250, currentY);
    doc.text(unitPrice.toFixed(2), 320, currentY);
    doc.text(sellTotal.toFixed(2), 450, currentY);

    currentY += 20;
  });

  // Total Box
  doc.strokeColor("#2196F3").lineWidth(1.5).moveTo(50, currentY + 5).lineTo(550, currentY + 5).stroke();
  const summaryY = currentY + 15;
  doc.fillColor("#E3F2FD").rect(320, summaryY - 4, 230, 26).fill();
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#1565C0");
  doc.text("Total Amount:", 330, summaryY + 2);
  doc.text(`Rs. ${totalAmount.toFixed(2)}`, 450, summaryY + 2);

  // Footer
  doc
    .fontSize(9)
    .font("Helvetica-Oblique")
    .fillColor("#1976D2")
    .text("Thank you for your business!", 50, doc.page.height - 60, { align: "center" })
    .fontSize(8)
    .fillColor("#888888")
    .text("This is a computer-generated invoice.", 50, doc.page.height - 45, { align: "center" });

  doc.end();
}

// GET all outgoing records
router.get("/", (req, res) => {
  db.all("SELECT * FROM outgoing ORDER BY record_id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET /outgoing error:", err.message);
      return res.status(500).json({ message: "Server error fetching outgoing records" });
    }
    res.json(rows);
  });
});

// GET single record by ID
router.get("/:record_id", (req, res) => {
  const { record_id } = req.params;
  db.get("SELECT * FROM outgoing WHERE record_id = ?", [record_id], (err, row) => {
    if (err) {
      console.error("GET /outgoing/:id error:", err.message);
      return res.status(500).json({ message: "Server error fetching record" });
    }
    if (!row) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.json(row);
  });
});

// POST create multi-item bill - ATOMIC SQL TRANSACTION
router.post("/", (req, res) => {
  const { date, buy_company, bill_number, items } = req.body;

  if (!date || !buy_company || !bill_number || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "Date, customer/company, bill number, and non-empty items array are required",
    });
  }

  // Validate items format
  for (const item of items) {
    if (!item.itam_name || item.qty == null) {
      return res.status(400).json({
        message: `Each item must have itam_name and qty. Failed on item: ${JSON.stringify(item)}`,
      });
    }

    const qty = Number(item.qty);
    if (Number.isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
      return res.status(400).json({ message: `Quantity for "${item.itam_name}" must be a positive integer` });
    }

    if (item.buy_price != null && (Number.isNaN(Number(item.buy_price)) || Number(item.buy_price) < 0)) {
      return res.status(400).json({ message: `Cost price for "${item.itam_name}" must be a non-negative number` });
    }
  }

  // Execute in an atomic transaction
  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION", (transErr) => {
      if (transErr) {
        console.error("Transaction begin error:", transErr);
        return res.status(500).json({ message: "Failed to begin transaction" });
      }

      const rollback = (status, msg) => {
        db.run("ROLLBACK", () => res.status(status).json({ message: msg }));
      };

      // Process items sequentially inside transaction
      let allInserted = [];
      let itemIndex = 0;

      function processNextItem() {
        if (itemIndex >= items.length) {
          // All items processed successfully -> COMMIT
          db.run("COMMIT", (commitErr) => {
            if (commitErr) return rollback(500, "Commit failed");
            return res.status(201).json({
              message: "Bill created successfully and stock updated",
              items: allInserted,
              bill_url: `/outgoing/bill/${encodeURIComponent(bill_number.trim())}`,
              bill_number: bill_number.trim(),
            });
          });
          return;
        }

        const currentItem = items[itemIndex];
        const itamName = String(currentItem.itam_name).trim();
        const qtyNum = Number(currentItem.qty);

        // Fetch current stock, selling price & cost price from itam table
        db.get(
          "SELECT itam_id, quantity, price_per_one, buy_price FROM itam WHERE itam_name = ?",
          [itamName],
          (err, itamRow) => {
            if (err) return rollback(500, "Database error during stock check");
            if (!itamRow) return rollback(404, `Item "${itamName}" does not exist in inventory`);

            const currentQty = Number(itamRow.quantity);
            const unitSellPrice = Number(itamRow.price_per_one);
            // Auto cost price from inventory record; fallback to client provided if any
            const unitCostPrice = (currentItem.buy_price != null && !Number.isNaN(Number(currentItem.buy_price)) && Number(currentItem.buy_price) > 0)
              ? Number(currentItem.buy_price)
              : Number(itamRow.buy_price || 0);

            const newBalance = currentQty - qtyNum;

            if (newBalance < 0) {
              return rollback(
                400,
                `Insufficient stock for "${itamName}". Available: ${currentQty}, Requested: ${qtyNum}`
              );
            }

            const totalSell = unitSellPrice * qtyNum;
            const totalCost = unitCostPrice * qtyNum;
            const profit = totalSell - totalCost;

            // Deduct stock
            db.run(
              "UPDATE itam SET quantity = ? WHERE itam_name = ?",
              [newBalance, itamName],
              (updateErr) => {
                if (updateErr) return rollback(500, `Failed to update stock for "${itamName}"`);

                // Insert into outgoing
                const insertSql = `
                  INSERT INTO outgoing (date, buy_company, bill_number, itam_name, qty, balance, sell_price, buy_price, profit)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(
                  insertSql,
                  [
                    String(date).trim(),
                    String(buy_company).trim(),
                    String(bill_number).trim(),
                    itamName,
                    qtyNum,
                    newBalance,
                    totalSell,
                    unitCostPrice,
                    profit,
                  ],
                  function (insertErr) {
                    if (insertErr) return rollback(500, `Failed to record sale for "${itamName}"`);

                    allInserted.push({
                      record_id: this.lastID,
                      itam_name: itamName,
                      qty: qtyNum,
                      unit_price: unitSellPrice,
                      unit_cost: unitCostPrice,
                      sell_price: totalSell,
                      buy_price: unitCostPrice,
                      profit,
                      balance: newBalance,
                    });

                    itemIndex++;
                    processNextItem();
                  }
                );
              }
            );
          }
        );
      }

      processNextItem();
    });
  });
});

// GET download PDF bill by bill number - Stream directly
router.get("/bill/:bill_number", (req, res) => {
  const { bill_number } = req.params;

  db.all(
    "SELECT * FROM outgoing WHERE bill_number = ?",
    [bill_number],
    (err, rows) => {
      if (err) {
        console.error("GET bill error:", err);
        return res.status(500).json({ message: "Server error fetching bill" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Bill not found" });
      }

      const billData = {
        date: rows[0].date,
        buy_company: rows[0].buy_company,
        bill_number: rows[0].bill_number,
        items: rows.map((r) => ({
          itam_name: r.itam_name,
          qty: r.qty,
          sell_price: r.sell_price,
        })),
      };

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="bill_${bill_number.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`
      );

      buildInvoiceStream(billData, res);
    }
  );
});

// DELETE record and restore stock - ATOMIC SQL TRANSACTION
router.delete("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.serialize(() => {
    db.run("BEGIN IMMEDIATE TRANSACTION", (transErr) => {
      if (transErr) return res.status(500).json({ message: "Failed to begin transaction" });

      const rollback = (status, msg) => {
        db.run("ROLLBACK", () => res.status(status).json({ message: msg }));
      };

      db.get("SELECT itam_name, qty FROM outgoing WHERE record_id = ?", [record_id], (err, row) => {
        if (err) return rollback(500, "Error querying outgoing record");
        if (!row) return rollback(404, "Record not found");

        const { itam_name, qty } = row;

        // Restore stock
        db.run(
          "UPDATE itam SET quantity = quantity + ? WHERE itam_name = ?",
          [qty, itam_name],
          (updateErr) => {
            if (updateErr) return rollback(500, "Failed to restore inventory stock");

            db.run("DELETE FROM outgoing WHERE record_id = ?", [record_id], (delErr) => {
              if (delErr) return rollback(500, "Failed to delete record");

              db.run("COMMIT", (commitErr) => {
                if (commitErr) return rollback(500, "Transaction commit failed");
                res.json({
                  message: "Outgoing record deleted and stock restored successfully",
                  restored_qty: qty,
                });
              });
            });
          }
        );
      });
    });
  });
});

// POST generate PDF report for outgoing records - Stream directly
router.post("/generate-pdf", (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "No records provided for PDF generation" });
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="outgoing_report_${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .fillColor("#1565C0")
      .text("OUTGOING RECORDS REPORT", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor("#1976D2")
      .text("Library Service Board - Central Province", { align: "center" })
      .moveDown(0.2);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#555555")
      .text("Gatambe, Peradeniya | Contact: 0812384032 | Email: libraryserviceboardcpc@gmail.com", { align: "center" })
      .text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${records.length}`, { align: "center" })
      .moveDown(0.8);

    doc.strokeColor("#2196F3").lineWidth(1.5).moveTo(50, doc.y).lineTo(790, doc.y).stroke().moveDown(0.5);

    // Totals
    const totalQty = records.reduce((sum, r) => sum + (Number(r?.qty) || 0), 0);
    const totalSales = records.reduce((sum, r) => sum + (Number(r?.sell_price) || 0), 0);
    const totalProfit = records.reduce((sum, r) => sum + (Number(r?.profit) || 0), 0);

    const summaryY = doc.y;
    doc.fillColor("#E3F2FD").rect(50, summaryY, 740, 36).fill();
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#1565C0");
    doc.text(`Total Quantity Sold: ${totalQty}`, 70, summaryY + 12);
    doc.text(`Total Revenue: Rs. ${totalSales.toFixed(2)}`, 290, summaryY + 12);
    doc.text(`Total Net Profit: Rs. ${totalProfit.toFixed(2)}`, 530, summaryY + 12);
    doc.moveDown(2);

    // Table Header
    const tableTop = doc.y + 10;
    doc.fillColor("#1976D2").rect(50, tableTop - 3, 740, 18).fill();
    doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
    doc.text("ID", 55, tableTop);
    doc.text("Date", 85, tableTop);
    doc.text("Customer", 150, tableTop);
    doc.text("Bill#", 260, tableTop);
    doc.text("Item Name", 330, tableTop);
    doc.text("Qty", 445, tableTop);
    doc.text("Remaining", 485, tableTop);
    doc.text("Total Sales", 545, tableTop);
    doc.text("Cost Price", 630, tableTop);
    doc.text("Profit", 715, tableTop);

    let currentY = tableTop + 20;
    doc.font("Helvetica").fontSize(7.5).fillColor("#333333");

    records.forEach((record, index) => {
      if (currentY > 510) {
        doc.addPage({ layout: "landscape" });
        currentY = 50;
      }

      if (index % 2 === 0) {
        doc.fillColor("#F8F9FA").rect(50, currentY - 2, 740, 16).fill();
      }

      const sellPrice = Number(record?.sell_price) || 0;
      const buyPrice = Number(record?.buy_price) || 0;
      const profit = Number(record?.profit) || 0;

      doc.fillColor("#333333");
      doc.text(String(record?.record_id ?? ""), 55, currentY);
      doc.text(String(record?.date ?? ""), 85, currentY);
      doc.text(String(record?.buy_company ?? "").substring(0, 20), 150, currentY);
      doc.text(String(record?.bill_number ?? ""), 260, currentY);
      doc.text(String(record?.itam_name ?? "").substring(0, 20), 330, currentY);
      doc.text(String(record?.qty ?? 0), 445, currentY);
      doc.text(String(record?.balance ?? 0), 485, currentY);
      doc.text(`Rs. ${sellPrice.toFixed(2)}`, 545, currentY);
      doc.text(`Rs. ${buyPrice.toFixed(2)}`, 630, currentY);

      if (profit >= 0) doc.fillColor("#2E7D32");
      else doc.fillColor("#C62828");
      doc.text(`Rs. ${profit.toFixed(2)}`, 715, currentY);

      currentY += 18;
    });

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica-Oblique")
      .fillColor("#777777")
      .text("Library Service Board - Central Province | Computer-generated financial report", 50, doc.page.height - 40, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("Outgoing report PDF error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate PDF report" });
    }
  }
});

module.exports = router;
