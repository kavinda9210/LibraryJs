import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * OutgoingManagement page (User side)
 * Opened from Dashboard.js -> "Outgoing Management"
 * Features:
 * - View outgoing records
 * - Advanced search/filter
 * - Generate PDF report for filtered records
 * - Download individual bills
 * - Add outgoing record
 * - Delete outgoing record
 * - Click row to open details modal
 */
function OutgoingManagement() {
  const [outgoing, setOutgoing] = useState([]);
  const [filteredOutgoing, setFilteredOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    buyCompany: "",
    billNumber: "",
    itamName: "",
    minQty: "",
    maxQty: "",
    minSellPrice: "",
    maxSellPrice: "",
    minProfit: "",
    maxProfit: "",
  });

  const navigate = useNavigate();

  const fetchOutgoing = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/outgoing/");
      setOutgoing(res.data || []);
      setFilteredOutgoing(res.data || []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to fetch outgoing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoing();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...outgoing];

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((item) => item.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((item) => item.date <= filters.dateTo);
    }

    // Text filters (case-insensitive partial match)
    if (filters.buyCompany) {
      filtered = filtered.filter((item) =>
        item.buy_company.toLowerCase().includes(filters.buyCompany.toLowerCase())
      );
    }
    if (filters.billNumber) {
      filtered = filtered.filter((item) =>
        item.bill_number.toLowerCase().includes(filters.billNumber.toLowerCase())
      );
    }
    if (filters.itamName) {
      filtered = filtered.filter((item) =>
        item.itam_name.toLowerCase().includes(filters.itamName.toLowerCase())
      );
    }

    // Quantity range filter
    if (filters.minQty) {
      filtered = filtered.filter((item) => item.qty >= Number(filters.minQty));
    }
    if (filters.maxQty) {
      filtered = filtered.filter((item) => item.qty <= Number(filters.maxQty));
    }

    // Sell Price range filter
    if (filters.minSellPrice) {
      filtered = filtered.filter((item) => item.sell_price >= Number(filters.minSellPrice));
    }
    if (filters.maxSellPrice) {
      filtered = filtered.filter((item) => item.sell_price <= Number(filters.maxSellPrice));
    }

    // Profit range filter
    if (filters.minProfit) {
      filtered = filtered.filter((item) => item.profit >= Number(filters.minProfit));
    }
    if (filters.maxProfit) {
      filtered = filtered.filter((item) => item.profit <= Number(filters.maxProfit));
    }

    setFilteredOutgoing(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      buyCompany: "",
      billNumber: "",
      itamName: "",
      minQty: "",
      maxQty: "",
      minSellPrice: "",
      maxSellPrice: "",
      minProfit: "",
      maxProfit: "",
    });
    setFilteredOutgoing(outgoing);
  };

  // Handle filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Generate PDF for filtered records
  const generatePDF = async () => {
    if (filteredOutgoing.length === 0) {
      alert("No records to generate PDF");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/outgoing/generate-pdf",
        { records: filteredOutgoing },
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `outgoing_report_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert("PDF generated successfully!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF report");
    }
  };

  // Download individual bill
  const downloadBill = (recordId) => {
    const billUrl = `http://localhost:5000/outgoing/bill/${recordId}`;
    window.open(billUrl, "_blank");
  };

  const handleShowDetails = async (recordId) => {
    try {
      const res = await axios.get(`http://localhost:5000/outgoing/${recordId}`);
      setSelected(res.data);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to load record details");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this outgoing record? Stock will be restored.")) return;
    try {
      await axios.delete(`http://localhost:5000/outgoing/${recordId}`);
      fetchOutgoing();
      alert("Record deleted and stock restored successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to delete record");
    }
  };

  const goToDashboard = () => navigate("/dashboard");
  const goToAddOutgoing = () => navigate("/add-outgoing");

  if (loading) return <div style={styles.loading}>Loading outgoing records...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Outgoing Management</h1>
        <div style={styles.headerButtons}>
          <button style={styles.filterButton} onClick={() => setShowFilterPanel(!showFilterPanel)}>
            🔍 {showFilterPanel ? "Hide Filters" : "Show Filters"}
          </button>
          <button style={styles.pdfButton} onClick={generatePDF}>
            📄 Generate PDF Report
          </button>
          <button style={styles.addButton} onClick={goToAddOutgoing}>
            + Add Outgoing
          </button>
        </div>
      </div>

      <button style={styles.backButton} onClick={goToDashboard}>
        ← Back to Dashboard
      </button>

      {/* Advanced Filter Panel */}
      {showFilterPanel && (
        <div style={styles.filterPanel}>
          <h3 style={styles.filterTitle}>Advanced Filters</h3>

          <div style={styles.filterGrid}>
            {/* Date Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date From:</label>
              <input
                style={styles.filterInput}
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Date To:</label>
              <input
                style={styles.filterInput}
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
              />
            </div>

            {/* Customer */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Customer:</label>
              <input
                style={styles.filterInput}
                type="text"
                name="buyCompany"
                placeholder="Search customer..."
                value={filters.buyCompany}
                onChange={handleFilterChange}
              />
            </div>

            {/* Bill Number */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Bill Number:</label>
              <input
                style={styles.filterInput}
                type="text"
                name="billNumber"
                placeholder="Search bill..."
                value={filters.billNumber}
                onChange={handleFilterChange}
              />
            </div>

            {/* Item Name */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Item Name:</label>
              <input
                style={styles.filterInput}
                type="text"
                name="itamName"
                placeholder="Search item..."
                value={filters.itamName}
                onChange={handleFilterChange}
              />
            </div>

            {/* Quantity Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Min Quantity:</label>
              <input
                style={styles.filterInput}
                type="number"
                name="minQty"
                placeholder="Min qty"
                value={filters.minQty}
                onChange={handleFilterChange}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Max Quantity:</label>
              <input
                style={styles.filterInput}
                type="number"
                name="maxQty"
                placeholder="Max qty"
                value={filters.maxQty}
                onChange={handleFilterChange}
              />
            </div>

            {/* Sell Price Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Min Sell Price:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="minSellPrice"
                placeholder="Min price"
                value={filters.minSellPrice}
                onChange={handleFilterChange}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Max Sell Price:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="maxSellPrice"
                placeholder="Max price"
                value={filters.maxSellPrice}
                onChange={handleFilterChange}
              />
            </div>

            {/* Profit Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Min Profit:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="minProfit"
                placeholder="Min profit"
                value={filters.minProfit}
                onChange={handleFilterChange}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Max Profit:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="maxProfit"
                placeholder="Max profit"
                value={filters.maxProfit}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div style={styles.filterActions}>
            <button style={styles.applyFilterButton} onClick={applyFilters}>
              Apply Filters
            </button>
            <button style={styles.clearFilterButton} onClick={clearFilters}>
              Clear Filters
            </button>
            <span style={styles.resultCount}>
              Showing {filteredOutgoing.length} of {outgoing.length} records
            </span>
          </div>
        </div>
      )}

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Record ID</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Bill No</th>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Balance</th>
              <th style={styles.th}>Sell Price</th>
              <th style={styles.th}>Buy Price</th>
              <th style={styles.th}>Profit</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredOutgoing.length === 0 ? (
              <tr>
                <td colSpan="11" style={styles.noRows}>
                  No outgoing records found
                </td>
              </tr>
            ) : (
              filteredOutgoing.map((row) => (
                <tr
                  key={row.record_id}
                  style={styles.tr}
                  onClick={() => handleShowDetails(row.record_id)}
                >
                  <td style={styles.td}>{row.record_id}</td>
                  <td style={styles.td}>{row.date}</td>
                  <td style={styles.td}>{row.buy_company}</td>
                  <td style={styles.td}>{row.bill_number}</td>
                  <td style={styles.td}>{row.itam_name}</td>
                  <td style={styles.td}>{row.qty}</td>
                  <td style={styles.td}>{row.balance}</td>
                  <td style={styles.td}>{row.sell_price}</td>
                  <td style={styles.td}>{row.buy_price}</td>
                  <td style={styles.td}>
                    <span style={row.profit >= 0 ? styles.profitPositive : styles.profitNegative}>
                      {row.profit.toFixed(2)}
                    </span>
                  </td>

                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.btn, ...styles.billBtn }}
                      onClick={() => downloadBill(row.record_id)}
                      title="Download Bill"
                    >
                      📄
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.deleteBtn }}
                      onClick={() => handleDelete(row.record_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && selected && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Outgoing Details</h2>
              <button style={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Record ID:</span>
                <span style={styles.detailValue}>{selected.record_id}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Date:</span>
                <span style={styles.detailValue}>{selected.date}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Customer:</span>
                <span style={styles.detailValue}>{selected.buy_company}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Bill Number:</span>
                <span style={styles.detailValue}>{selected.bill_number}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Item Name:</span>
                <span style={styles.detailValue}>{selected.itam_name}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Quantity:</span>
                <span style={styles.detailValue}>{selected.qty}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Balance:</span>
                <span style={styles.detailValue}>{selected.balance}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Sell Price:</span>
                <span style={styles.detailValue}>{selected.sell_price}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Buy Price:</span>
                <span style={styles.detailValue}>{selected.buy_price}</span>
              </div>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Profit:</span>
                <span style={styles.detailValue}>{selected.profit}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.downloadBillBtn}
                onClick={() => downloadBill(selected.record_id)}
              >
                📄 Download Bill
              </button>
              <button style={styles.modalCloseBtn} onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 20, fontFamily: "Arial, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 10,
  },
  headerButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: 5,
  },
  filterButton: {
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: 5,
  },
  pdfButton: {
    backgroundColor: "#FF5722",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: 5,
  },
  backButton: {
    marginBottom: 15,
    backgroundColor: "#555",
    color: "white",
    border: "none",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: 5,
  },
  filterPanel: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  filterTitle: {
    marginTop: 0,
    marginBottom: 15,
    color: "#333",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 15,
    marginBottom: 15,
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  filterInput: {
    padding: 8,
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 14,
  },
  filterActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  applyFilterButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: 5,
    fontWeight: "bold",
  },
  clearFilterButton: {
    backgroundColor: "#999",
    color: "white",
    border: "none",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: 5,
  },
  resultCount: {
    fontSize: 14,
    color: "#555",
    fontWeight: "bold",
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #ddd", padding: 8, backgroundColor: "#f2f2f2" },
  td: { border: "1px solid #ddd", padding: 8, textAlign: "center" },
  tr: { cursor: "pointer" },
  noRows: { textAlign: "center", padding: 20, color: "#888" },
  loading: { textAlign: "center", padding: 20 },
  error: { textAlign: "center", padding: 20, color: "red" },
  btn: {
    margin: "0 3px",
    padding: "6px 10px",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    color: "white",
  },
  deleteBtn: { backgroundColor: "#f44336" },
  billBtn: { backgroundColor: "#2196F3" },
  profitPositive: { color: "#4CAF50", fontWeight: "bold" },
  profitNegative: { color: "#f44336", fontWeight: "bold" },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: 450,
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  closeButton: { background: "none", border: "none", fontSize: 20, cursor: "pointer" },
  modalBody: { marginBottom: 15 },
  detailRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
  detailLabel: { fontWeight: "bold" },
  detailValue: { marginLeft: 10 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10 },
  downloadBillBtn: {
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 5,
    cursor: "pointer",
  },
  modalCloseBtn: {
    backgroundColor: "#777",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: 5,
    cursor: "pointer",
  },
};

export default OutgoingManagement;