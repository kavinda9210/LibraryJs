import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * IncomeManagement page (User side)
 * Opened from: Dashboard.js -> "Income Management" button
 * Features:
 * - View all income records
 * - Advanced search/filter
 * - Generate PDF report for filtered records
 * - View income record details (modal)
 * - Add income record
 * - Delete income record
 * - Back button returns to User Dashboard (/dashboard)
 *
 * Backend endpoints expected:
 * GET    http://localhost:5000/income/
 * GET    http://localhost:5000/income/:record_id
 * DELETE http://localhost:5000/income/:record_id
 * POST   http://localhost:5000/income/generate-pdf (for filtered report)
 *
 * Add Income page route expected:
 * /add-income
 */
function IncomeManagement() {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    supplyCompany: "",
    billNumber: "",
    itamName: "",
    approvalStatus: "",
    minQty: "",
    maxQty: "",
    minPrice: "",
    maxPrice: "",
  });

  const navigate = useNavigate();

  // Fetch income records from backend
  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/income/");
      setIncomes(response.data);
      setFilteredIncomes(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch income records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load records once
  useEffect(() => {
    fetchIncomes();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...incomes];

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter((inc) => inc.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((inc) => inc.date <= filters.dateTo);
    }

    // Text filters (case-insensitive partial match)
    if (filters.supplyCompany) {
      filtered = filtered.filter((inc) =>
        inc.supply_company.toLowerCase().includes(filters.supplyCompany.toLowerCase())
      );
    }
    if (filters.billNumber) {
      filtered = filtered.filter((inc) =>
        inc.bill_number.toLowerCase().includes(filters.billNumber.toLowerCase())
      );
    }
    if (filters.itamName) {
      filtered = filtered.filter((inc) =>
        inc.itam_name.toLowerCase().includes(filters.itamName.toLowerCase())
      );
    }

    // Approval status filter
    if (filters.approvalStatus) {
      filtered = filtered.filter((inc) => inc.approval_status === filters.approvalStatus);
    }

    // Quantity range filter
    if (filters.minQty) {
      filtered = filtered.filter((inc) => inc.qty >= Number(filters.minQty));
    }
    if (filters.maxQty) {
      filtered = filtered.filter((inc) => inc.qty <= Number(filters.maxQty));
    }

    // Price range filter
    if (filters.minPrice) {
      filtered = filtered.filter((inc) => inc.buy_price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((inc) => inc.buy_price <= Number(filters.maxPrice));
    }

    setFilteredIncomes(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      supplyCompany: "",
      billNumber: "",
      itamName: "",
      approvalStatus: "",
      minQty: "",
      maxQty: "",
      minPrice: "",
      maxPrice: "",
    });
    setFilteredIncomes(incomes);
  };

  // Handle filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Generate PDF for filtered records
  const generatePDF = async () => {
    if (filteredIncomes.length === 0) {
      alert("No records to generate PDF");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/income/generate-pdf",
        { records: filteredIncomes },
        { responseType: "blob" }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `income_report_${new Date().toISOString().split("T")[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert("PDF generated successfully!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF report");
    }
  };

  // Show record details
  const handleShowDetails = async (recordId) => {
    try {
      const response = await axios.get(`http://localhost:5000/income/${recordId}`);
      setSelectedIncome(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch income details:", err);
      alert("Failed to load income details");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedIncome(null);
  };

  // Delete record
  const handleDelete = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this income record?")) {
      try {
        await axios.delete(`http://localhost:5000/income/${recordId}`);
        fetchIncomes();
      } catch (err) {
        console.error("Failed to delete income record:", err);
        alert("Failed to delete income record");
      }
    }
  };

  // Add income
  const handleAddIncome = () => {
    navigate("/add-income");
  };

  // Back to user dashboard
  const goToDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) return <div style={styles.loading}>Loading income records...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Income Management</h1>
        <div style={styles.headerButtons}>
          <button style={styles.filterButton} onClick={() => setShowFilterPanel(!showFilterPanel)}>
            🔍 {showFilterPanel ? "Hide Filters" : "Show Filters"}
          </button>
          <button style={styles.pdfButton} onClick={generatePDF}>
            📄 Generate PDF Report
          </button>
          <button style={styles.addButton} onClick={handleAddIncome}>
            + Add Income
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

            {/* Supply Company */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Supply Company:</label>
              <input
                style={styles.filterInput}
                type="text"
                name="supplyCompany"
                placeholder="Search company..."
                value={filters.supplyCompany}
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

            {/* Approval Status */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Approval Status:</label>
              <select
                style={styles.filterInput}
                name="approvalStatus"
                value={filters.approvalStatus}
                onChange={handleFilterChange}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
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

            {/* Price Range */}
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Min Price:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="minPrice"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Max Price:</label>
              <input
                style={styles.filterInput}
                type="number"
                step="0.01"
                name="maxPrice"
                placeholder="Max price"
                value={filters.maxPrice}
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
              Showing {filteredIncomes.length} of {incomes.length} records
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
              <th style={styles.th}>Supply Company</th>
              <th style={styles.th}>Bill No</th>
              <th style={styles.th}>Item</th>
              <th style={styles.th}>Qty</th>
              <th style={styles.th}>Buy Price</th>
              <th style={styles.th}>Approval</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredIncomes.length === 0 ? (
              <tr>
                <td colSpan="9" style={styles.noRows}>
                  No income records found
                </td>
              </tr>
            ) : (
              filteredIncomes.map((inc) => (
                <tr
                  key={inc.record_id}
                  style={styles.tr}
                  onClick={() => handleShowDetails(inc.record_id)}
                >
                  <td style={styles.td}>{inc.record_id}</td>
                  <td style={styles.td}>{inc.date}</td>
                  <td style={styles.td}>{inc.supply_company}</td>
                  <td style={styles.td}>{inc.bill_number}</td>
                  <td style={styles.td}>{inc.itam_name}</td>
                  <td style={styles.td}>{inc.qty}</td>
                  <td style={styles.td}>{inc.buy_price}</td>
                  <td style={styles.td}>
                    <span style={getApprovalStyle(inc.approval_status)}>
                      {inc.approval_status}
                    </span>
                  </td>

                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.button, ...styles.deleteButton }}
                      onClick={() => handleDelete(inc.record_id)}
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

      {/* Details Modal */}
      {showModal && selectedIncome && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Income Details</h2>
              <button style={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Record ID:</span>
                <span style={styles.detailValue}>{selectedIncome.record_id}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Date:</span>
                <span style={styles.detailValue}>{selectedIncome.date}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Supply Company:</span>
                <span style={styles.detailValue}>{selectedIncome.supply_company}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Bill Number:</span>
                <span style={styles.detailValue}>{selectedIncome.bill_number}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Item Name:</span>
                <span style={styles.detailValue}>{selectedIncome.itam_name}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Qty:</span>
                <span style={styles.detailValue}>{selectedIncome.qty}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Buy Price:</span>
                <span style={styles.detailValue}>{selectedIncome.buy_price}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Approval:</span>
                <span style={styles.detailValue}>{selectedIncome.approval_status}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
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

// Helper function for approval status styling
const getApprovalStyle = (status) => {
  const baseStyle = {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "bold",
  };

  switch (status) {
    case "approved":
      return { ...baseStyle, backgroundColor: "#4CAF50", color: "white" };
    case "rejected":
      return { ...baseStyle, backgroundColor: "#f44336", color: "white" };
    case "pending":
      return { ...baseStyle, backgroundColor: "#FF9800", color: "white" };
    default:
      return { ...baseStyle, backgroundColor: "#999", color: "white" };
  }
};

const styles = {
  container: { padding: "20px", fontFamily: "Arial, sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  addButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  filterButton: {
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  pdfButton: {
    backgroundColor: "#FF5722",
    color: "white",
    border: "none",
    padding: "10px 15px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  backButton: {
    marginBottom: "15px",
    backgroundColor: "#555",
    color: "white",
    border: "none",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  filterPanel: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },
  filterTitle: {
    marginTop: 0,
    marginBottom: "15px",
    color: "#333",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "15px",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: "bold",
    marginBottom: "5px",
    color: "#555",
  },
  filterInput: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "14px",
  },
  filterActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  applyFilterButton: {
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: "5px",
    fontWeight: "bold",
  },
  clearFilterButton: {
    backgroundColor: "#999",
    color: "white",
    border: "none",
    padding: "10px 20px",
    cursor: "pointer",
    borderRadius: "5px",
  },
  resultCount: {
    fontSize: "14px",
    color: "#555",
    fontWeight: "bold",
  },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #ddd", padding: "8px", backgroundColor: "#f2f2f2" },
  td: { border: "1px solid #ddd", padding: "8px", textAlign: "center" },
  tr: { cursor: "pointer" },
  noRows: { textAlign: "center", padding: "20px", color: "#888" },
  button: {
    margin: "0 5px",
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  deleteButton: { backgroundColor: "#f44336", color: "white" },
  loading: { textAlign: "center", padding: "20px" },
  error: { textAlign: "center", padding: "20px", color: "red" },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "420px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  modalTitle: { margin: 0 },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalBody: { marginBottom: "15px" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  detailLabel: { fontWeight: "bold" },
  detailValue: { marginLeft: "10px" },
  modalFooter: { display: "flex", justifyContent: "flex-end" },
  modalCloseBtn: {
    backgroundColor: "#777",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default IncomeManagement;