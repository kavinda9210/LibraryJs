import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * Admin Income Approval Page
 * Shows only income records where approval_status = "pending"
 * Admin can Approve, Reject, or Edit a record
 */
function AdminIncomeApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/income/pending");
      setPending(res.data || []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const setApproval = async (record_id, status) => {
    try {
      await axios.patch(`http://localhost:5000/income/${record_id}/approval`, {
        approval_status: status,
      });
      fetchPending();
    } catch (e) {
      console.error(e);
      alert("Failed to update approval status");
    }
  };

  const openEdit = (row) => {
    setEditForm({ ...row });
    setShowEdit(true);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setEditForm(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    try {
      // qty & buy_price should be numbers
      const payload = {
        date: editForm.date,
        supply_company: editForm.supply_company,
        bill_number: editForm.bill_number,
        itam_name: editForm.itam_name,
        qty: Number(editForm.qty),
        buy_price: Number(editForm.buy_price),
      };

      await axios.put(`http://localhost:5000/income/${editForm.record_id}`, payload);
      closeEdit();
      fetchPending();
    } catch (e) {
      console.error(e);
      alert("Failed to update record");
    }
  };

  if (loading) return <div style={styles.loading}>Loading pending approvals...</div>;
  if (error) return <div style={styles.error}>{error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Admin: Pending Income Approvals</h1>
        <button style={styles.backButton} onClick={() => navigate("/admin-dashboard")}>
          ← Back to Admin Dashboard
        </button>
      </div>

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
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {pending.length === 0 ? (
              <tr>
                <td colSpan="8" style={styles.noRows}>
                  No pending approvals 🎉
                </td>
              </tr>
            ) : (
              pending.map((row) => (
                <tr key={row.record_id}>
                  <td style={styles.td}>{row.record_id}</td>
                  <td style={styles.td}>{row.date}</td>
                  <td style={styles.td}>{row.supply_company}</td>
                  <td style={styles.td}>{row.bill_number}</td>
                  <td style={styles.td}>{row.itam_name}</td>
                  <td style={styles.td}>{row.qty}</td>
                  <td style={styles.td}>{row.buy_price}</td>

                  <td style={styles.td}>
                    <button
                      style={{ ...styles.btn, ...styles.approveBtn }}
                      onClick={() => setApproval(row.record_id, "approved")}
                    >
                      Approve
                    </button>

                    <button
                      style={{ ...styles.btn, ...styles.rejectBtn }}
                      onClick={() => setApproval(row.record_id, "rejected")}
                    >
                      Reject
                    </button>

                    <button
                      style={{ ...styles.btn, ...styles.editBtn }}
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div style={styles.modalOverlay} onClick={closeEdit}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ margin: 0 }}>Edit Income Record</h2>
              <button style={styles.closeButton} onClick={closeEdit}>
                ×
              </button>
            </div>

            <div style={styles.formGrid}>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" name="date" value={editForm.date} onChange={handleEditChange} />

              <label style={styles.label}>Supply Company</label>
              <input style={styles.input} name="supply_company" value={editForm.supply_company} onChange={handleEditChange} />

              <label style={styles.label}>Bill Number</label>
              <input style={styles.input} name="bill_number" value={editForm.bill_number} onChange={handleEditChange} />

              <label style={styles.label}>Item Name</label>
              <input style={styles.input} name="itam_name" value={editForm.itam_name} onChange={handleEditChange} />

              <label style={styles.label}>Qty</label>
              <input style={styles.input} type="number" name="qty" value={editForm.qty} onChange={handleEditChange} />

              <label style={styles.label}>Buy Price</label>
              <input style={styles.input} type="number" step="0.01" name="buy_price" value={editForm.buy_price} onChange={handleEditChange} />
            </div>

            <div style={styles.modalFooter}>
              <button style={{ ...styles.btn, ...styles.editBtn }} onClick={saveEdit}>
                Save
              </button>
              <button style={{ ...styles.btn, ...styles.grayBtn }} onClick={closeEdit}>
                Cancel
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 15 },
  backButton: { background: "#555", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 6, cursor: "pointer" },
  tableContainer: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { border: "1px solid #ddd", padding: 8, background: "#f2f2f2" },
  td: { border: "1px solid #ddd", padding: 8, textAlign: "center" },
  noRows: { textAlign: "center", padding: 18, color: "#777" },
  loading: { textAlign: "center", padding: 20 },
  error: { textAlign: "center", padding: 20, color: "red" },

  btn: { border: "none", padding: "6px 10px", margin: "0 4px", borderRadius: 5, cursor: "pointer", color: "#fff" },
  approveBtn: { background: "#28a745" },
  rejectBtn: { background: "#dc3545" },
  editBtn: { background: "#007bff" },
  grayBtn: { background: "#6c757d" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" },
  modalContent: { background: "#fff", width: 520, maxWidth: "90vw", padding: 16, borderRadius: 10 },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  closeButton: { background: "none", border: "none", fontSize: 22, cursor: "pointer" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, alignItems: "center" },
  label: { fontWeight: "bold" },
  input: { padding: 8, border: "1px solid #ccc", borderRadius: 6 },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 },
};

export default AdminIncomeApproval;
