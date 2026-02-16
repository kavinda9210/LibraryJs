const express = require("express");
const router = express.Router();
const db = require("./db");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * OUTGOING ROUTES
 * Mount in server.js:
 *   const outgoingRoutes = require("./outgoing");
 *   app.use("/outgoing", outgoingRoutes);
 *
 * Endpoints:
 *   GET    /outgoing/             -> all outgoing records
 *   GET    /outgoing/:record_id   -> single record
 *   POST   /outgoing/             -> add outgoing record (updates itam.quantity, auto-calculates sell_price, generates PDF bill)
 *   DELETE /outgoing/:record_id   -> delete record (restores stock to itam)
 *   GET    /outgoing/bill/:record_id -> download PDF bill
 */

// Create bills directory if it doesn't exist
const billsDir = path.join(__dirname, "bills");
if (!fs.existsSync(billsDir)) {
  fs.mkdirSync(billsDir);
}

// ✅ GET all outgoing records
router.get("/", (req, res) => {
  db.all("SELECT * FROM outgoing ORDER BY record_id DESC", [], (err, rows) => {
    if (err) {
      console.error("GET /outgoing error:", err.message);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(rows);
  });
});

// ✅ GET one outgoing record
router.get("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.get(
    "SELECT * FROM outgoing WHERE record_id = ?",
    [record_id],
    (err, row) => {
      if (err) {
        console.error("GET /outgoing/:id error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      if (!row) return res.status(404).json({ message: "Record not found" });
      res.json(row);
    }
  );
});

// ✅ Function to generate PDF bill
function generateBill(recordData, filepath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SALES INVOICE", { align: "center" })
        .moveDown(0.5);

      // Company Info (customize this)
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Your Company Name", { align: "center" })
        .text("Address Line 1, City, Country", { align: "center" })
        .text("Phone: +123456789 | Email: info@company.com", { align: "center" })
        .moveDown(1);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Bill details in two columns
      const leftColumn = 50;
      const rightColumn = 320;
      let currentY = doc.y;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Bill To:", leftColumn, currentY);
      doc.font("Helvetica");
      doc.text(recordData.buy_company, leftColumn, currentY + 15);

      doc.font("Helvetica-Bold");
      doc.text("Bill Number:", rightColumn, currentY);
      doc.text("Date:", rightColumn, currentY + 15);
      doc.text("Record ID:", rightColumn, currentY + 30);

      doc.font("Helvetica");
      doc.text(recordData.bill_number, rightColumn + 80, currentY);
      doc.text(recordData.date, rightColumn + 80, currentY + 15);
      doc.text(`#${recordData.record_id}`, rightColumn + 80, currentY + 30);

      doc.moveDown(3);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Table Header
      currentY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", leftColumn, currentY);
      doc.text("Qty", 250, currentY);
      doc.text("Unit Price", 320, currentY);
      doc.text("Amount", 450, currentY);

      doc.moveDown(0.5);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Table Content
      currentY = doc.y;
      const unitPrice = recordData.sell_price / recordData.qty;
      
      doc.font("Helvetica");
      doc.text(recordData.itam_name, leftColumn, currentY, { width: 180 });
      doc.text(recordData.qty.toString(), 250, currentY);
      doc.text(unitPrice.toFixed(2), 320, currentY);
      doc.text(recordData.sell_price.toFixed(2), 450, currentY);

      doc.moveDown(2);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Total section
      currentY = doc.y;
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Total Amount:", 350, currentY);
      doc.text(`${recordData.sell_price.toFixed(2)}`, 450, currentY);

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .text("Thank you for your business!", { align: "center" })
        .moveDown(0.5)
        .text("This is a computer-generated invoice.", { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(filepath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}

// ✅ POST add outgoing record (stock out)
// - Auto-calculates sell_price from itam.price_per_one * qty
// - checks current itam.quantity
// - balance = quantity - qty
// - updates itam.quantity = balance
// - saves outgoing record with balance + profit
// - generates PDF bill
router.post("/", (req, res) => {
  const { date, buy_company, bill_number, itam_name, qty, buy_price } = req.body;

  if (
    !date ||
    !buy_company ||
    !bill_number ||
    !itam_name ||
    qty == null ||
    buy_price == null
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const qtyNum = Number(qty);
  const buyNum = Number(buy_price);

  if (Number.isNaN(qtyNum) || qtyNum <= 0) {
    return res.status(400).json({ message: "qty must be a positive number" });
  }
  if (Number.isNaN(buyNum) || buyNum < 0) {
    return res.status(400).json({ message: "buy_price must be valid" });
  }

  db.serialize(() => {
    // 1) get current stock and price_per_one
    db.get(
      "SELECT quantity, price_per_one FROM itam WHERE itam_name = ?",
      [itam_name],
      (err, itamRow) => {
        if (err) {
          console.error("Stock check error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }

        if (!itamRow) {
          return res.status(404).json({ message: "Item not found in itam table" });
        }

        const currentQty = Number(itamRow.quantity);
        const pricePerOne = Number(itamRow.price_per_one);
        const balance = currentQty - qtyNum;

        if (balance < 0) {
          return res.status(400).json({
            message: `Not enough stock. Available: ${currentQty}, Requested: ${qtyNum}`,
          });
        }

        // Auto-calculate sell_price
        const sellNum = pricePerOne * qtyNum;
        const profit = sellNum - (buyNum * qtyNum);

        // 2) update stock
        db.run(
          "UPDATE itam SET quantity = ? WHERE itam_name = ?",
          [balance, itam_name],
          function (err) {
            if (err) {
              console.error("Stock update error:", err.message);
              return res.status(500).json({ message: "Server error" });
            }

            // 3) insert outgoing record
            const sql = `
              INSERT INTO outgoing
              (date, buy_company, bill_number, itam_name, qty, balance, sell_price, buy_price, profit)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(
              sql,
              [date, buy_company, bill_number, itam_name, qtyNum, balance, sellNum, buyNum, profit],
              function (err) {
                if (err) {
                  console.error("Insert outgoing error:", err.message);
                  return res.status(500).json({ message: "Server error" });
                }

                const recordId = this.lastID;

                // 4) Generate PDF bill
                const recordData = {
                  record_id: recordId,
                  date,
                  buy_company,
                  bill_number,
                  itam_name,
                  qty: qtyNum,
                  sell_price: sellNum,
                  buy_price: buyNum,
                  profit,
                  balance,
                };

                const billFilename = `bill_${bill_number}_${recordId}.pdf`;
                const billPath = path.join(billsDir, billFilename);

                generateBill(recordData, billPath)
                  .then(() => {
                    return res.status(201).json({
                      message: "Outgoing record added, stock updated & bill generated",
                      record_id: recordId,
                      balance,
                      sell_price: sellNum,
                      profit,
                      bill_url: `/outgoing/bill/${recordId}`,
                      bill_filename: billFilename,
                    });
                  })
                  .catch((pdfErr) => {
                    console.error("PDF generation error:", pdfErr);
                    // Still return success for the record, but note PDF failed
                    return res.status(201).json({
                      message: "Outgoing record added & stock updated (bill generation failed)",
                      record_id: recordId,
                      balance,
                      sell_price: sellNum,
                      profit,
                      pdf_error: true,
                    });
                  });
              }
            );
          }
        );
      }
    );
  });
});

// ✅ GET download PDF bill
router.get("/bill/:record_id", (req, res) => {
  const { record_id } = req.params;

  // Get record details
  db.get(
    "SELECT * FROM outgoing WHERE record_id = ?",
    [record_id],
    (err, row) => {
      if (err) {
        console.error("GET bill error:", err.message);
        return res.status(500).json({ message: "Server error" });
      }
      if (!row) {
        return res.status(404).json({ message: "Record not found" });
      }

      const billFilename = `bill_${row.bill_number}_${record_id}.pdf`;
      const billPath = path.join(billsDir, billFilename);

      // Check if bill exists
      if (fs.existsSync(billPath)) {
        res.download(billPath, billFilename);
      } else {
        // Generate bill if it doesn't exist
        generateBill(row, billPath)
          .then(() => {
            res.download(billPath, billFilename);
          })
          .catch((pdfErr) => {
            console.error("PDF generation error:", pdfErr);
            res.status(500).json({ message: "Failed to generate bill" });
          });
      }
    }
  );
});

// ✅ DELETE outgoing record AND restore stock
router.delete("/:record_id", (req, res) => {
  const { record_id } = req.params;

  db.serialize(() => {
    // 1) Get the outgoing record to know qty, itam_name, and bill info
    db.get(
      "SELECT itam_name, qty, bill_number FROM outgoing WHERE record_id = ?",
      [record_id],
      (err, row) => {
        if (err) {
          console.error("DELETE fetch error:", err.message);
          return res.status(500).json({ message: "Server error" });
        }
        if (!row) {
          return res.status(404).json({ message: "Record not found" });
        }

        const { itam_name, qty, bill_number } = row;

        // 2) Restore stock in itam table
        db.run(
          "UPDATE itam SET quantity = quantity + ? WHERE itam_name = ?",
          [qty, itam_name],
          function (err) {
            if (err) {
              console.error("Stock restore error:", err.message);
              return res.status(500).json({ message: "Server error" });
            }

            // 3) Delete the outgoing record
            db.run(
              "DELETE FROM outgoing WHERE record_id = ?",
              [record_id],
              function (err) {
                if (err) {
                  console.error("DELETE outgoing error:", err.message);
                  return res.status(500).json({ message: "Server error" });
                }

                // 4) Delete the PDF bill file (optional)
                const billFilename = `bill_${bill_number}_${record_id}.pdf`;
                const billPath = path.join(billsDir, billFilename);
                
                if (fs.existsSync(billPath)) {
                  fs.unlinkSync(billPath);
                }

                res.json({
                  message: "Outgoing record deleted & stock restored",
                  restored_qty: qty,
                });
              }
            );
          }
        );
      }
    );
  });
});

// ✅ Function to generate PDF bill
function generateBill(recordData, filepath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filepath);

      doc.pipe(stream);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .text("SALES INVOICE", { align: "center" })
        .moveDown(0.5);

      // Company Info (customize this)
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Your Company Name", { align: "center" })
        .text("Address Line 1, City, Country", { align: "center" })
        .text("Phone: +123456789 | Email: info@company.com", { align: "center" })
        .moveDown(1);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Bill details in two columns
      const leftColumn = 50;
      const rightColumn = 320;
      let currentY = doc.y;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Bill To:", leftColumn, currentY);
      doc.font("Helvetica");
      doc.text(recordData.buy_company, leftColumn, currentY + 15);

      doc.font("Helvetica-Bold");
      doc.text("Bill Number:", rightColumn, currentY);
      doc.text("Date:", rightColumn, currentY + 15);
      doc.text("Record ID:", rightColumn, currentY + 30);

      doc.font("Helvetica");
      doc.text(recordData.bill_number, rightColumn + 80, currentY);
      doc.text(recordData.date, rightColumn + 80, currentY + 15);
      doc.text(`#${recordData.record_id}`, rightColumn + 80, currentY + 30);

      doc.moveDown(3);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Table Header
      currentY = doc.y;
      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Item", leftColumn, currentY);
      doc.text("Qty", 250, currentY);
      doc.text("Unit Price", 320, currentY);
      doc.text("Amount", 450, currentY);

      doc.moveDown(0.5);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Table Content
      currentY = doc.y;
      const unitPrice = recordData.sell_price / recordData.qty;
      
      doc.font("Helvetica");
      doc.text(recordData.itam_name, leftColumn, currentY, { width: 180 });
      doc.text(recordData.qty.toString(), 250, currentY);
      doc.text(unitPrice.toFixed(2), 320, currentY);
      doc.text(recordData.sell_price.toFixed(2), 450, currentY);

      doc.moveDown(2);

      // Divider line
      doc
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown(0.5);

      // Total section
      currentY = doc.y;
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("Total Amount:", 350, currentY);
      doc.text(`${recordData.sell_price.toFixed(2)}`, 450, currentY);

      doc.moveDown(2);

      // Footer
      doc
        .fontSize(9)
        .font("Helvetica")
        .text("Thank you for your business!", { align: "center" })
        .moveDown(0.5)
        .text("This is a computer-generated invoice.", { align: "center" });

      doc.end();

      stream.on("finish", () => resolve(filepath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
// Add this after the existing routes in outgoing.js

// ✅ POST generate PDF report for filtered outgoing records
router.post("/generate-pdf", (req, res) => {
  const { records } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "No records provided" });
  }

  try {
    const doc = new PDFDocument({ margin: 50, size: "A4", layout: "landscape" });
    const filename = `outgoing_report_${Date.now()}.pdf`;
    const filepath = path.join(billsDir, filename);
    const stream = fs.createWriteStream(filepath);

    doc.pipe(stream);

    // Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("OUTGOING RECORDS REPORT", { align: "center" })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" })
      .text(`Total Records: ${records.length}`, { align: "center" })
      .moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke().moveDown(0.5);

    // Calculate totals (coerce to numbers because the UI may send strings)
    const totalQty = records.reduce((sum, r) => sum + (Number(r?.qty) || 0), 0);
    const totalSellPrice = records.reduce(
      (sum, r) => sum + (Number(r?.sell_price) || 0),
      0
    );
    const totalProfit = records.reduce((sum, r) => sum + (Number(r?.profit) || 0), 0);

    // Summary section
    doc.fontSize(12).font("Helvetica-Bold").text("Summary:", 50, doc.y);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Total Quantity: ${totalQty}`, 50, doc.y + 5);
    doc.text(`Total Sales: ${totalSellPrice.toFixed(2)}`, 50, doc.y + 5);
    doc.text(`Total Profit: ${totalProfit.toFixed(2)}`, 50, doc.y + 5);
    doc.moveDown(1);

    // Divider
    doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke().moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("ID", 50, tableTop);
    doc.text("Date", 80, tableTop);
    doc.text("Customer", 140, tableTop, { width: 100 });
    doc.text("Bill#", 250, tableTop);
    doc.text("Item", 310, tableTop, { width: 100 });
    doc.text("Qty", 420, tableTop);
    doc.text("Balance", 460, tableTop);
    doc.text("Sell Price", 520, tableTop);
    doc.text("Buy Price", 590, tableTop);
    doc.text("Profit", 660, tableTop);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(790, doc.y).stroke().moveDown(0.3);

    // Table rows
    doc.font("Helvetica").fontSize(7);
    let currentY = doc.y;

    records.forEach((record) => {
      // Check if we need a new page
      if (currentY > 520) {
        doc.addPage({ layout: "landscape" });
        currentY = 50;
      }

      const recordId = record?.record_id ?? "";
      const date = record?.date ?? "";
      const buyCompany = String(record?.buy_company ?? "").substring(0, 15);
      const billNumber = record?.bill_number ?? "";
      const itemName = String(record?.itam_name ?? "").substring(0, 15);
      const qty = Number(record?.qty) || 0;
      const balance = Number(record?.balance) || 0;
      const sellPrice = Number(record?.sell_price) || 0;
      const buyPrice = Number(record?.buy_price) || 0;
      const profit = Number(record?.profit) || 0;

      doc.text(recordId, 50, currentY);
      doc.text(date, 80, currentY);
      doc.text(buyCompany, 140, currentY);
      doc.text(billNumber, 250, currentY);
      doc.text(itemName, 310, currentY);
      doc.text(qty.toString(), 420, currentY);
      doc.text(balance.toString(), 460, currentY);
      doc.text(sellPrice.toFixed(2), 520, currentY);
      doc.text(buyPrice.toFixed(2), 590, currentY);
      doc.text(profit.toFixed(2), 660, currentY);

      currentY += 18;
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