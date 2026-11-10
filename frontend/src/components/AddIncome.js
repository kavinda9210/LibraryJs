import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiFileText,
  FiPackage,
  FiLayers,
  FiArrowLeft,
  FiAlertCircle,
  FiSave,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * AddIncome page
 * Route: /add-income
 * - Form to add income record
 * - Item field is a dropdown loaded from /itam/
 * - On success: navigate back to /income-management
 */
function AddIncome() {
  const navigate = useNavigate();

  const [itams, setItams] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    date: "",
    supply_company: "",
    bill_number: "",
    itam_name: "",
    qty: "",
    buy_price: "",
  });

  // Load all ITAMs for dropdown
  useEffect(() => {
    const fetchItams = async () => {
      try {
        setLoadingItems(true);
        const res = await apiClient.get("/itam");
        setItams(res.data || []);
      } catch (err) {
        console.error("Failed to load items:", err);
        setError("Failed to load items for dropdown");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItams();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (
      !form.date ||
      !form.supply_company ||
      !form.bill_number ||
      !form.itam_name ||
      form.qty === "" ||
      form.buy_price === ""
    ) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Convert numbers
      const payload = {
        ...form,
        qty: Number(form.qty),
        buy_price: Number(form.buy_price),
      };

      await apiClient.post("/income", payload);

      alert("Income record added successfully!");
      navigate("/income-management");
    } catch (err) {
      console.error("Failed to add income:", err);
      setError(err.response?.data?.message || "Failed to add income record");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/income-management");
  };

  return (
    <div className="add-income-page">
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
                  <h5 className="mb-0 nav-title">Add Income Record</h5>
                  <small className="nav-subtitle">
                    Create a new income transaction
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back" onClick={handleCancel}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Income
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
                    <FiDollarSign size={40} />
                  </div>
                  <h2 className="form-title mb-2">New Income Record</h2>
                  <p className="form-description">
                    Fill in the details below to add a new income transaction.
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
                    {/* Date */}
                    <div className="col-md-6">
                      <label htmlFor="date" className="form-label">
                        <FiCalendar size={16} className="me-2" />
                        Date <span className="required-mark">*</span>
                      </label>
                      <input
                        type="date"
                        className="form-control form-control-custom"
                        id="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Bill Number */}
                    <div className="col-md-6">
                      <label htmlFor="bill_number" className="form-label">
                        <FiFileText size={16} className="me-2" />
                        Bill Number <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="bill_number"
                        name="bill_number"
                        value={form.bill_number}
                        onChange={handleChange}
                        placeholder="Enter bill number"
                        required
                      />
                    </div>

                    {/* Supply Company */}
                    <div className="col-12">
                      <label htmlFor="supply_company" className="form-label">
                        <FiTag size={16} className="me-2" />
                        Supply Company <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="supply_company"
                        name="supply_company"
                        value={form.supply_company}
                        onChange={handleChange}
                        placeholder="Enter supply company name"
                        required
                      />
                    </div>

                    {/* Item Dropdown */}
                    <div className="col-12">
                      <label htmlFor="itam_name" className="form-label">
                        <FiPackage size={16} className="me-2" />
                        Item <span className="required-mark">*</span>
                      </label>
                      <select
                        className="form-select form-control-custom"
                        id="itam_name"
                        name="itam_name"
                        value={form.itam_name}
                        onChange={handleChange}
                        disabled={loadingItems}
                        required
                      >
                        <option value="">
                          {loadingItems ? "Loading items..." : "Select an item"}
                        </option>
                        {itams.map((itam) => (
                          <option key={itam.itam_id} value={itam.itam_name}>
                            {itam.itam_name} (No: {itam.itam_no})
                          </option>
                        ))}
                      </select>
                      <small className="form-text text-muted">
                        Select the item from inventory
                      </small>
                    </div>

                    {/* Quantity */}
                    <div className="col-md-6">
                      <label htmlFor="qty" className="form-label">
                        <FiLayers size={16} className="me-2" />
                        Quantity <span className="required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        id="qty"
                        name="qty"
                        value={form.qty}
                        onChange={handleChange}
                        placeholder="0"
                        min="1"
                        required
                      />
                      <small className="form-text text-muted">
                        Number of units purchased
                      </small>
                    </div>

                    {/* Buy Price */}
                    <div className="col-md-6">
                      <label htmlFor="buy_price" className="form-label">
                        <FiDollarSign size={16} className="me-2" />
                        Buy Price (Rs.) <span className="required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        id="buy_price"
                        name="buy_price"
                        value={form.buy_price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                      <small className="form-text text-muted">
                        Price per unit in Sri Lankan Rupees
                      </small>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions mt-5">
                    <button
                      type="button"
                      className="btn btn-cancel me-3"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-submit"
                      disabled={saving || loadingItems}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave size={18} className="me-2" />
                          Save Income Record
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
        .add-income-page {
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

        .form-control-custom,
        .form-select {
          border: 2px solid #BBDEFB;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #F5F5F5;
        }

        .form-control-custom:focus,
        .form-select:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .form-control-custom::placeholder {
          color: #90A4AE;
        }

        .form-control-custom:disabled,
        .form-select:disabled {
          background: #ECEFF1;
          cursor: not-allowed;
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

export default AddIncome;