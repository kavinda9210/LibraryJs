import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Show user details
  const handleShowDetails = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/users/${userId}`);
      setSelectedUser(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      alert("Failed to load user details");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Delete user function
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Failed to delete user:", err);
        alert("Failed to delete user");
      }
    }
  };

  // Edit user function
  const handleEdit = (user) => {
    navigate(`/edit-user/${user.id}`, { state: { user } });
  };

  // Add user function
  const handleAddUser = () => {
    navigate("/add-user");
  };

  // Go back to admin dashboard
  const goToAdminDashboard = () => {
    navigate("/admin-dashboard");
  };

  if (loading) return <div style={styles.loading}>Loading users...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>User Management</h1>
        <button style={styles.addButton} onClick={handleAddUser}>
          + Add User
        </button>
      </div>
      
      {/* Updated back button */}
      <button style={styles.backButton} onClick={goToAdminDashboard}>
        ← Back to Dashboard
      </button>
      
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" style={styles.noUsers}>
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user.id} 
                  style={styles.tr}
                  onClick={() => handleShowDetails(user.id)}
                >
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.contact_number || "N/A"}</td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <button
                      style={{ ...styles.button, ...styles.editButton }}
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.deleteButton }}
                      onClick={() => handleDelete(user.id)}
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

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>User Details</h2>
              <button style={styles.closeButton} onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>ID:</span>
                <span style={styles.detailValue}>{selectedUser.id}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Username:</span>
                <span style={styles.detailValue}>{selectedUser.username}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Email:</span>
                <span style={styles.detailValue}>{selectedUser.email}</span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Contact Number:</span>
                <span style={styles.detailValue}>
                  {selectedUser.contact_number || "Not provided"}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>ID Number:</span>
                <span style={styles.detailValue}>
                  {selectedUser.id_number || "Not provided"}
                </span>
              </div>
              
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Address:</span>
                <span style={styles.detailValue}>
                  {selectedUser.address || "Not provided"}
                </span>
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.editButton }}
                onClick={() => {
                  handleCloseModal();
                  handleEdit(selectedUser);
                }}
              >
                Edit User
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
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  loading: {
    padding: "40px",
    textAlign: "center",
    fontSize: "18px",
  },
  error: {
    padding: "40px",
    textAlign: "center",
    fontSize: "18px",
    color: "red",
  },
  addButton: {
    padding: "10px 20px",
    backgroundColor: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "500",
  },
  backButton: {
    padding: "10px 15px",
    marginBottom: "20px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
  },
  th: {
    backgroundColor: "#f8f9fa",
    padding: "12px 15px",
    textAlign: "left",
    borderBottom: "2px solid #dee2e6",
    fontWeight: "600",
  },
  td: {
    padding: "12px 15px",
    borderBottom: "1px solid #dee2e6",
  },
  tr: {
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  noUsers: {
    textAlign: "center",
    padding: "40px",
    color: "#6c757d",
  },
  button: {
    padding: "6px 12px",
    margin: "0 4px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
  editButton: {
    backgroundColor: "#ffc107",
    color: "#212529",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    color: "white",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflow: "auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #dee2e6",
  },
  modalTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#333",
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "32px",
    cursor: "pointer",
    color: "#6c757d",
    lineHeight: "1",
    padding: "0",
    width: "32px",
    height: "32px",
  },
  modalBody: {
    padding: "20px",
  },
  detailRow: {
    display: "flex",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  detailLabel: {
    fontWeight: "600",
    width: "160px",
    color: "#555",
    flexShrink: 0,
  },
  detailValue: {
    color: "#333",
    flex: 1,
    wordBreak: "break-word",
  },
  modalFooter: {
    padding: "20px",
    borderTop: "1px solid #dee2e6",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  modalCloseBtn: {
    padding: "10px 20px",
    backgroundColor: "#6c757d",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  },
};

export default UserManagement;