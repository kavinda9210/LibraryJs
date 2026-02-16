import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ItamManagement() {
  const [itams, setItams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItam, setSelectedItam] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Fetch items from backend
  const fetchItams = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/itam/");
      setItams(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItams();
  }, []);

  // Show item details
  const handleShowDetails = async (itamId) => {
    try {
      const response = await axios.get(`http://localhost:5000/itam/${itamId}`);
      setSelectedItam(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch item details:", err);
      alert("Failed to load item details");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItam(null);
  };

  // Delete item
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await axios.delete(`http://localhost:5000/itam/${id}`);
        fetchItams();
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert("Failed to delete item");
      }
    }
  };

  // Edit item
  const handleEdit = (itam) => {
    navigate(`/edit-itam/${itam.itam_id}`, { state: { itam } });
  };

  // Add item
  const handleAddItam = () => {
    navigate("/add-item");
  };

  // Back to dashboard
  const goToAdminDashboard = () => {
    navigate("/admin-dashboard");
  };

  if (loading) return <div style={styles.loading}>Loading items...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Item Management</h1>
        <button style={styles.addButton} onClick={handleAddItam}>
          + Add Item
        </button>
      </div>

      <button style={styles.backButton} onClick={goToAdminDashboard}>
        ← Back to Dashboard
      </button>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Item No</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {itams.length === 0 ? (
              <tr>
                <td colSpan="6" style={styles.noItams}>
                  No items found
                </td>
              </tr>
            ) : (
              itams.map((itam) => (
                <tr
                  key={itam.itam_id}
                  style={styles.tr}
                  onClick={() => handleShowDetails(itam.itam_id)}
                >
                  <td style={styles.td}>{itam.itam_id}</td>
                  <td style={styles.td}>{itam.itam_no}</td>
                  <td style={styles.td}>{itam.itam_name}</td>
                  <td style={styles.td}>{itam.price_per_one}</td>
                  <td style={styles.td}>{itam.quantity}</td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.button, ...styles.editButton }}
                      onClick={() => handleEdit(itam)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.deleteButton }}
                      onClick={() => handleDelete(itam.itam_id)}
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

      {/* Item Details Modal */}
      {showModal && selectedItam && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Item Details</h2>
              <button style={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>ID:</span>
                <span style={styles.detailValue}>{selectedItam.itam_id}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Item No:</span>
                <span style={styles.detailValue}>{selectedItam.itam_no}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Name:</span>
                <span style={styles.detailValue}>{selectedItam.itam_name}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Price:</span>
                <span style={styles.detailValue}>{selectedItam.price_per_one}</span>
              </div>

              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Quantity:</span>
                <span style={styles.detailValue}>{selectedItam.quantity}</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.editButton }}
                onClick={() => {
                  handleCloseModal();
                  handleEdit(selectedItam);
                }}
              >
                Edit Item
              </button>
              <button
                style={styles.modalCloseBtn}
                onClick={handleCloseModal}
              >
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
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  addButton: {
    backgroundColor: "#4CAF50",
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
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    border: "1px solid #ddd",
    padding: "8px",
    backgroundColor: "#f2f2f2",
  },
  td: {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "center",
  },
  tr: {
    cursor: "pointer",
  },
  noItams: {
    textAlign: "center",
    padding: "20px",
    color: "#888",
  },
  button: {
    margin: "0 5px",
    padding: "6px 10px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  editButton: {
    backgroundColor: "#2196F3",
    color: "white",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    color: "white",
  },
  loading: {
    textAlign: "center",
    padding: "20px",
  },
  error: {
    textAlign: "center",
    padding: "20px",
    color: "red",
  },
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
  },
  modalContent: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  modalTitle: {
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
  },
  modalBody: {
    marginBottom: "15px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  detailLabel: {
    fontWeight: "bold",
  },
  detailValue: {
    marginLeft: "10px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  modalCloseBtn: {
    backgroundColor: "#777",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
  },
};

export default ItamManagement;