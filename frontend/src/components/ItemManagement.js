import React, { useState, useEffect } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiPackage,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiArrowLeft,
  FiHash,
  FiTag,
  FiDollarSign,
  FiLayers,
  FiX,
  FiEye,
  FiSearch,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function ItemManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch items from backend
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/itam");
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch items");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Show item details
  const handleShowDetails = async (itemId) => {
    try {
      const response = await apiClient.get(`/itam/${itemId}`);
      setSelectedItem(response.data);
      setShowModal(true);
    } catch (err) {
      console.error("Failed to fetch item details:", err);
      alert("Failed to load item details");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  // Delete item
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await apiClient.delete(`/itam/${id}`);
        fetchItems();
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert(err.response?.data?.error || "Failed to delete item");
      }
    }
  };

  // Edit item
  const handleEdit = (item) => {
    navigate(`/edit-item/${item.itam_id}`, { state: { itam: item } });
  };

  // Add item
  const handleAddItem = () => {
    navigate("/add-item");
  };

  // Back to dashboard
  const handleBack = () => {
    if (user?.role === "admin") {
      navigate("/admin-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  // Filter items based on search
  const filteredItems = items.filter(
    (item) =>
      item.itam_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itam_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itam_id?.toString().includes(searchTerm)
  );

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text mt-3">Loading items...</p>
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
    <div className="item-management">
      {/* Top Navigation Bar */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiPackage size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Item Management</h5>
                  <small className="nav-subtitle">
                    Manage inventory items and stock
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back me-2" onClick={handleBack}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Dashboard
              </button>
              <button className="btn btn-add" onClick={handleAddItem}>
                <FiPlus size={18} className="me-2" />
                Add Item
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
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
                    placeholder="Search by item name, number, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="row">
          <div className="col-12">
            <div className="card table-card shadow-lg">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table items-table mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item No</th>
                        <th>Name</th>
                        <th>Selling Price</th>
                        <th>Cost Price</th>
                        <th>Quantity</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <div className="no-items">
                              <FiPackage size={48} className="mb-3" />
                              <p className="mb-0">
                                {searchTerm
                                  ? "No items found matching your search"
                                  : "No items found"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr key={item.itam_id} className="item-row">
                            <td className="item-id">
                              <span className="id-badge">{item.itam_id}</span>
                            </td>
                            <td className="item-number">
                              <div className="d-flex align-items-center">
                                <FiHash size={14} className="me-2 text-muted" />
                                <span className="fw-semibold">{item.itam_no}</span>
                              </div>
                            </td>
                            <td className="item-name">
                              <div className="d-flex align-items-center">
                                <div className="item-icon me-2">
                                  <FiPackage size={16} />
                                </div>
                                <span>{item.itam_name}</span>
                              </div>
                            </td>
                            <td className="item-price">
                              <span className="price-badge">
                                Rs. {parseFloat(item.price_per_one).toFixed(2)}
                              </span>
                            </td>
                            <td className="item-cost-price">
                              <span className="badge bg-light text-secondary border px-2 py-1">
                                Rs. {parseFloat(item.buy_price || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="item-quantity">
                              <span className={`quantity-badge ${item.quantity < 10 ? 'low-stock' : ''}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="item-actions text-center">
                              <button
                                className="btn btn-action btn-view me-2"
                                onClick={() => handleShowDetails(item.itam_id)}
                                title="View Details"
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-edit me-2"
                                onClick={() => handleEdit(item)}
                                title="Edit Item"
                              >
                                <FiEdit size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-delete"
                                onClick={() => handleDelete(item.itam_id)}
                                title="Delete Item"
                              >
                                <FiTrash2 size={16} />
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
                  Showing {filteredItems.length} of {items.length} items
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Details Modal */}
      {showModal && selectedItem && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="d-flex align-items-center">
                <div className="modal-item-icon me-3">
                  <FiPackage size={28} />
                </div>
                <div>
                  <h4 className="modal-title mb-1">Item Details</h4>
                  <p className="modal-subtitle mb-0">{selectedItem.itam_name}</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="detail-item">
                <div className="detail-icon">
                  <FiHash size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Item ID</span>
                  <span className="detail-value">{selectedItem.itam_id}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiHash size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Item Number</span>
                  <span className="detail-value">{selectedItem.itam_no}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiTag size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Item Name</span>
                  <span className="detail-value">{selectedItem.itam_name}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiDollarSign size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Selling Price Per Unit</span>
                  <span className="detail-value">
                    Rs. {parseFloat(selectedItem.price_per_one).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiDollarSign size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Cost / Buy Price Per Unit</span>
                  <span className="detail-value text-secondary">
                    Rs. {parseFloat(selectedItem.buy_price || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiLayers size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Quantity in Stock</span>
                  <span className="detail-value">{selectedItem.quantity}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button
                className="btn btn-modal-edit"
                onClick={() => {
                  handleCloseModal();
                  handleEdit(selectedItem);
                }}
              >
                <FiEdit size={18} className="me-2" />
                Edit Item
              </button>
              <button className="btn btn-modal-close" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .item-management {
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

        /* Buttons */
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

        .btn-add {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
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
        .items-table {
          width: 100%;
          margin-bottom: 0 !important;
        }

        .items-table thead {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        }

        .items-table thead th {
          color: #FFFFFF !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          padding: 16px 20px !important;
          border: none !important;
          background: transparent !important;
        }

        .items-table tbody td {
          padding: 16px 20px;
          vertical-align: middle;
          border-bottom: 1px solid #E3F2FD;
          color: #333;
        }

        .item-row {
          transition: all 0.2s ease;
        }

        .item-row:hover {
          background: #F5F5F5;
        }

        /* Item Icon */
        .item-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 2px solid #90CAF9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1976D2;
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

        .quantity-badge {
          background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
          color: #01579B;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #81D4FA;
          display: inline-block;
        }

        .quantity-badge.low-stock {
          background: linear-gradient(135deg, #FFE082 0%, #FFD54F 100%);
          color: #F57F17;
          border: 1px solid #FFCA28;
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

        .btn-view {
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          color: #FFFFFF;
        }

        .btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
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

        .btn-delete {
          background: linear-gradient(135deg, #EF5350 0%, #F44336 100%);
          color: #FFFFFF;
        }

        .btn-delete:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
          color: #FFFFFF;
        }

        /* No Items State */
        .no-items {
          color: #1976D2;
        }

        .no-items svg {
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
          max-width: 600px;
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

        .modal-item-icon {
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

        .detail-item {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid #E3F2FD;
          transition: all 0.2s ease;
        }

        .detail-item:hover {
          background: #F5F5F5;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 2px solid #90CAF9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1976D2;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #1976D2;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .detail-value {
          color: #333;
          font-size: 1rem;
          font-weight: 500;
          word-break: break-word;
        }

        .modal-footer-custom {
          padding: 20px 24px;
          border-top: 2px solid #E3F2FD;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #F5F5F5;
        }

        .btn-modal-edit {
          background: linear-gradient(135deg, #FFA726 0%, #FF9800 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 167, 38, 0.3);
          color: #FFFFFF;
        }

        .btn-modal-close {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-close:hover {
          background: #2196F3;
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

          .items-table thead th {
            font-size: 0.75rem;
            padding: 12px 10px !important;
          }

          .items-table tbody td {
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

export default ItemManagement;