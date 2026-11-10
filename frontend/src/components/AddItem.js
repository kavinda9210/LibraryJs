import React, { useState } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiHash,
  FiTag,
  FiDollarSign,
  FiLayers,
  FiArrowLeft,
  FiAlertCircle,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function AddItem() {
  const [formData, setFormData] = useState({
    itam_no: "",
    itam_name: "",
    price_per_one: "",
    buy_price: "",
    quantity: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // API call to add item
      await apiClient.post("/itam", {
        ...formData,
        buy_price: formData.buy_price ? Number(formData.buy_price) : 0,
      });

      // Success message
      alert("Item added successfully!");

      // Go to Admin ItemManagement page
      navigate("/item-management");
    } catch (err) {
      setError("Failed to add item. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/item-management");
  };

  return (
    <div className="add-item-page">
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
                  <h5 className="mb-0 nav-title">Admin - Add New Item</h5>
                  <small className="nav-subtitle">
                    Add a new item to inventory system
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back" onClick={handleCancel}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Items
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-7">
            <div className="card form-card shadow-lg">
              <div className="card-body p-4 p-md-5">
                {/* Form Header */}
                <div className="form-header mb-4">
                  <div className="form-icon-wrapper mb-3">
                    <FiPackage size={40} />
                  </div>
                  <h2 className="form-title mb-2">Create New Item</h2>
                  <p className="form-description">
                    Fill in the details below to add a new item to the inventory system.
                    All fields are required.
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div
                    className="alert alert-danger-custom alert-dismissible fade show mb-4"
                    role="alert"
                  >
                    <FiAlertCircle size={20} className="me-2" />
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Item Number */}
                    <div className="col-md-6">
                      <label htmlFor="itam_no" className="form-label">
                        <FiHash size={16} className="me-2" />
                        Item Number <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="itam_no"
                        name="itam_no"
                        value={formData.itam_no}
                        onChange={handleChange}
                        placeholder="e.g., ITM-001"
                        required
                      />
                    </div>

                    {/* Item Name */}
                    <div className="col-md-6">
                      <label htmlFor="itam_name" className="form-label">
                        <FiTag size={16} className="me-2" />
                        Item Name <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="itam_name"
                        name="itam_name"
                        value={formData.itam_name}
                        onChange={handleChange}
                        placeholder="Enter item name"
                        required
                      />
                    </div>

                    {/* Price Per One (Selling Price) */}
                    <div className="col-md-6">
                      <label htmlFor="price_per_one" className="form-label">
                        <FiDollarSign size={16} className="me-2" />
                        Selling Price Per Unit (Rs.) <span className="required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        id="price_per_one"
                        name="price_per_one"
                        value={formData.price_per_one}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                      <small className="form-text text-muted">
                        Customer selling price in Sri Lankan Rupees
                      </small>
                    </div>

                    {/* Cost / Buy Price */}
                    <div className="col-md-6">
                      <label htmlFor="buy_price" className="form-label">
                        <FiDollarSign size={16} className="me-2" />
                        Cost / Buy Price Per Unit (Rs.)
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        id="buy_price"
                        name="buy_price"
                        value={formData.buy_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                      />
                      <small className="form-text text-muted">
                        Wholesale purchase cost per unit (Rs.)
                      </small>
                    </div>

                    {/* Quantity */}
                    <div className="col-md-12">
                      <label htmlFor="quantity" className="form-label">
                        <FiLayers size={16} className="me-2" />
                        Quantity <span className="required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        placeholder="0"
                        min="0"
                        required
                      />
                      <small className="form-text text-muted">
                        Initial stock quantity
                      </small>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions mt-5">
                    <button
                      type="button"
                      className="btn btn-cancel me-3"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Adding Item...
                        </>
                      ) : (
                        <>
                          <FiPackage size={18} className="me-2" />
                          Add Item
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .add-item-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
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

        /* Form Card */
        .form-card {
          border: none;
          border-radius: 20px;
          background: #FFFFFF;
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.6s ease-out;
        }

        .form-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #2196F3 0%, #1976D2 100%);
        }

        /* Form Header */
        .form-header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #E3F2FD;
        }

        .form-icon-wrapper {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 3px solid #90CAF9;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #1976D2;
          margin-bottom: 1rem;
        }

        .form-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }

        .form-description {
          color: #546E7A;
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }

        .required-mark {
          color: #F44336;
          font-weight: 700;
        }

        /* Form Controls */
        .form-label {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .form-control-custom {
          border: 2px solid #BBDEFB;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #F5F5F5;
        }

        .form-control-custom:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .form-control-custom::placeholder {
          color: #90A4AE;
        }

        .form-text {
          color: #1976D2;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }

        /* Alert */
        .alert-danger-custom {
          background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
          border: 1px solid #EF9A9A;
          border-left: 4px solid #F44336;
          color: #C62828;
          border-radius: 12px;
          display: flex;
          align-items: center;
          font-weight: 500;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 20px;
          border-top: 2px solid #E3F2FD;
        }

        .btn-cancel {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 12px;
          color: #1976D2;
          font-weight: 600;
          padding: 12px 30px;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .btn-cancel:hover:not(:disabled) {
          background: #2196F3;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .btn-cancel:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-submit {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          padding: 12px 30px;
          transition: all 0.3s ease;
          font-size: 1rem;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          color: #FFFFFF;
        }

        .btn-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
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

          .form-title {
            font-size: 1.4rem;
          }

          .form-actions {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .btn-cancel,
          .btn-submit {
            width: 100%;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AddItem;