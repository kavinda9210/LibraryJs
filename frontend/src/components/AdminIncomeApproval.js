import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiCheck,
  FiX,
  FiEdit,
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiPackage,
  FiLayers,
  FiTag,
  FiClock,
  FiSearch,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * Admin Income Approval Page
 * Shows only income records where approval_status = "pending"
 * Admin can Approve, Reject, or Edit a record
 */
function AdminIncomeApproval() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const navigate = useNavigate();

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/income/pending");
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
    const statusText = status === "approved" ? "approve" : "reject";
    if (window.confirm(`Are you sure you want to ${statusText} this record?`)) {
      try {
        await apiClient.patch(`/income/${record_id}/approval`, {
          approval_status: status,
        });
        fetchPending();
      } catch (e) {
        console.error(e);
        alert("Failed to update approval status");
      }
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
      const payload = {
        date: editForm.date,
        supply_company: editForm.supply_company,
        bill_number: editForm.bill_number,
        itam_name: editForm.itam_name,
        qty: Number(editForm.qty),
        buy_price: Number(editForm.buy_price),
      };

      await apiClient.put(`/income/${editForm.record_id}`, payload);
      closeEdit();
      fetchPending();
    } catch (e) {
      console.error(e);
      alert("Failed to update record");
    }
  };

  // Filter records based on search
  const filteredPending = pending.filter(
    (record) =>
      record.supply_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.bill_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.itam_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.record_id?.toString().includes(searchTerm)
  );

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text mt-3">Loading pending approvals...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );

  return (
    <div className="income-approval">
      {/* Top Navigation Bar */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiDollarSign size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Pending Income Approvals</h5>
                  <small className="nav-subtitle">
                    Review and approve income records
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button
                className="btn btn-back"
                onClick={() => navigate("/admin-dashboard")}
              >
                <FiArrowLeft size={18} className="me-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {/* Stats Card */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card stat-card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="stat-label mb-1">Pending Approvals</p>
                    <h3 className="stat-value mb-0">{pending.length}</h3>
                  </div>
                  <div className="stat-icon">
                    <FiClock size={24} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card search-card shadow-sm">
              <div className="card-body p-3">
                <div className="input-group">
                  <span className="input-group-text search-icon">
                    <FiSearch size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search by company, bill number, item, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="row">
          <div className="col-12">
            <div className="card table-card shadow-lg">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table approvals-table mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Supply Company</th>
                        <th>Bill No</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Buy Price</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPending.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="no-records">
                              {searchTerm ? (
                                <>
                                  <FiSearch size={48} className="mb-3" />
                                  <p className="mb-0">
                                    No records found matching your search
                                  </p>
                                </>
                              ) : (
                                <>
                                  <FiCheck size={48} className="mb-3" />
                                  <p className="mb-0">
                                    No pending approvals 🎉
                                  </p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPending.map((row) => (
                          <tr key={row.record_id} className="approval-row">
                            <td>
                              <span className="id-badge">{row.record_id}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiCalendar size={14} className="me-2 text-muted" />
                                {row.date}
                              </div>
                            </td>
                            <td className="fw-semibold">{row.supply_company}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiFileText size={14} className="me-2 text-muted" />
                                {row.bill_number}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiPackage size={14} className="me-2 text-muted" />
                                {row.itam_name}
                              </div>
                            </td>
                            <td>
                              <span className="qty-badge">{row.qty}</span>
                            </td>
                            <td>
                              <span className="price-badge">
                                Rs. {parseFloat(row.buy_price).toFixed(2)}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-action btn-approve me-2"
                                onClick={() =>
                                  setApproval(row.record_id, "approved")
                                }
                                title="Approve"
                              >
                                <FiCheck size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-reject me-2"
                                onClick={() =>
                                  setApproval(row.record_id, "rejected")
                                }
                                title="Reject"
                              >
                                <FiX size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-edit"
                                onClick={() => openEdit(row)}
                                title="Edit"
                              >
                                <FiEdit size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer">
                <small className="text-muted">
                  Showing {filteredPending.length} of {pending.length} pending
                  records
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editForm && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="d-flex align-items-center">
                <div className="modal-icon me-3">
                  <FiEdit size={28} />
                </div>
                <div>
                  <h4 className="modal-title mb-1">Edit Income Record</h4>
                  <p className="modal-subtitle mb-0">
                    Record ID: {editForm.record_id}
                  </p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={closeEdit}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label-modal">
                    <FiCalendar size={16} className="me-2" />
                    Date
                  </label>
                  <input
                    className="form-control form-control-modal"
                    type="date"
                    name="date"
                    value={editForm.date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-modal">
                    <FiFileText size={16} className="me-2" />
                    Bill Number
                  </label>
                  <input
                    className="form-control form-control-modal"
                    name="bill_number"
                    value={editForm.bill_number}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label-modal">
                    <FiTag size={16} className="me-2" />
                    Supply Company
                  </label>
                  <input
                    className="form-control form-control-modal"
                    name="supply_company"
                    value={editForm.supply_company}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label-modal">
                    <FiPackage size={16} className="me-2" />
                    Item Name
                  </label>
                  <input
                    className="form-control form-control-modal"
                    name="itam_name"
                    value={editForm.itam_name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-modal">
                    <FiLayers size={16} className="me-2" />
                    Quantity
                  </label>
                  <input
                    className="form-control form-control-modal"
                    type="number"
                    name="qty"
                    value={editForm.qty}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label-modal">
                    <FiDollarSign size={16} className="me-2" />
                    Buy Price (Rs.)
                  </label>
                  <input
                    className="form-control form-control-modal"
                    type="number"
                    step="0.01"
                    name="buy_price"
                    value={editForm.buy_price}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button className="btn btn-modal-cancel me-3" onClick={closeEdit}>
                Cancel
              </button>
              <button className="btn btn-modal-save" onClick={saveEdit}>
                <FiCheck size={18} className="me-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .income-approval {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Loading & Error States */
        .loading-container,
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          flex-direction: column;
        }

        .loading-text {
          color: #1565C0;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .spinner-border {
          color: #2196F3 !important;
          width: 3rem;
          height: 3rem;
        }

        /* Top Navigation */
        .top-nav {
          background: linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%);
          border-bottom: 3px solid #2196F3;
        }

        .page-icon {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .nav-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .nav-subtitle {
          color: #1976D2;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .btn-back {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: #2196F3;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        /* Stat Card */
        .stat-card {
          border: none;
          border-radius: 14px;
          background: #FFFFFF;
          transition: all 0.3s ease;
          border-left: 4px solid #FFA726;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(33, 150, 243, 0.15) !important;
        }

        .stat-label {
          color: #1976D2;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          color: #1565C0;
          font-weight: 800;
          font-size: 2rem;
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        /* Search Card */
        .search-card {
          border: none;
          border-radius: 14px;
          background: #FFFFFF;
        }

        .search-icon {
          background: #E3F2FD;
          border: 2px solid #BBDEFB;
          border-right: none;
          border-radius: 12px 0 0 12px;
          color: #1976D2;
        }

        .search-input {
          border: 2px solid #BBDEFB;
          border-left: none;
          border-radius: 0 12px 12px 0;
          padding: 12px 16px;
          font-size: 1rem;
        }

        .search-input:focus {
          border-color: #2196F3;
          border-left: none;
          box-shadow: none;
          outline: none;
        }

        /* Table Card */
        .table-card {
          border: none;
          border-radius: 18px;
          background: #FFFFFF;
          overflow: hidden;
        }

        .table-card .card-footer {
          background: #E3F2FD;
          border-top: 2px solid #BBDEFB;
          padding: 12px 20px;
        }

        /* Table Styles */
        .approvals-table {
          width: 100%;
        }

        .approvals-table thead {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        }

        .approvals-table thead th {
          color: #FFFFFF !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          padding: 16px 20px !important;
          border: none !important;
          background: transparent !important;
        }

        .approvals-table tbody td {
          padding: 16px 20px;
          vertical-align: middle;
          border-bottom: 1px solid #E3F2FD;
          color: #333;
        }

        .approval-row {
          transition: all 0.2s ease;
        }

        .approval-row:hover {
          background: #F5F5F5;
        }

        /* Badges */
        .id-badge {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          color: #1565C0;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          border: 2px solid #90CAF9;
          display: inline-block;
        }

        .qty-badge {
          background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
          color: #01579B;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #81D4FA;
          display: inline-block;
        }

        .price-badge {
          background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%);
          color: #1B5E20;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #81C784;
          display: inline-block;
        }

        /* Action Buttons */
        .btn-action {
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 8px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .btn-approve {
          background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
          color: #FFFFFF;
        }

        .btn-approve:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 187, 106, 0.3);
          color: #FFFFFF;
        }

        .btn-reject {
          background: linear-gradient(135deg, #EF5350 0%, #F44336 100%);
          color: #FFFFFF;
        }

        .btn-reject:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
          color: #FFFFFF;
        }

        .btn-edit {
          background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%);
          color: #FFFFFF;
        }

        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
          color: #FFFFFF;
        }

        /* No Records State */
        .no-records {
          color: #1976D2;
        }

        .no-records svg {
          color: #90CAF9;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(33, 150, 243, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
          animation: fadeIn 0.3s ease;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(33, 150, 243, 0.4);
          animation: slideUp 0.3s ease;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #FFFFFF;
        }

        .modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .modal-title {
          color: #FFFFFF;
          font-weight: 700;
          margin: 0;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .btn-close-modal {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-close-modal:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body-custom {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .form-label-modal {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .form-control-modal {
          border: 2px solid #BBDEFB;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #F5F5F5;
        }

        .form-control-modal:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .modal-footer-custom {
          padding: 20px 24px;
          border-top: 2px solid #E3F2FD;
          display: flex;
          justify-content: flex-end;
          background: #F5F5F5;
        }

        .btn-modal-cancel {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-cancel:hover {
          background: #2196F3;
          color: #FFFFFF;
        }

        .btn-modal-save {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-save:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
          color: #FFFFFF;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-title {
            font-size: 1.1rem;
          }

          .approvals-table thead th {
            font-size: 0.75rem;
            padding: 12px 10px !important;
          }

          .approvals-table tbody td {
            padding: 12px 10px;
            font-size: 0.9rem;
          }

          .btn-action {
            width: 32px;
            height: 32px;
          }

          .modal-container {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminIncomeApproval;