import React, { useState, useEffect } from "react";
import apiClient from "../api/client";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiCreditCard,
  FiMapPin,
  FiArrowLeft,
  FiEdit,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    contact_number: "",
    id_number: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        // Try to use data from location state first, otherwise fetch from API
        if (location.state?.user) {
          setFormData({
            username: location.state.user.username || "",
            email: location.state.user.email || "",
            password: "", // Don't pre-fill password
            contact_number: location.state.user.contact_number || "",
            id_number: location.state.user.id_number || "",
            address: location.state.user.address || "",
          });
        } else {
          const response = await apiClient.get(`/users/${id}`);
          setFormData({
            username: response.data.username || "",
            email: response.data.email || "",
            password: "",
            contact_number: response.data.contact_number || "",
            id_number: response.data.id_number || "",
            address: response.data.address || "",
          });
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load user data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.username || !formData.email) {
      setError("Username and email are required");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Only send password if it's been changed (not empty)
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await apiClient.put(`/users/${id}`, updateData);

      // Redirect back to user management on success
      navigate("/user-management");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update user");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/user-management");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text mt-3">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="edit-user-page">
      {/* Top Navigation Bar */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiEdit size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Edit User</h5>
                  <small className="nav-subtitle">
                    Update user account information
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back" onClick={handleCancel}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Users
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
                    <FiEdit size={40} />
                  </div>
                  <h2 className="form-title mb-2">Edit User Information</h2>
                  <p className="form-description">
                    Update the user details below. Fields marked with{" "}
                    <span className="required-mark">*</span> are required.
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

                {/* Info Alert for Password */}
                <div className="alert alert-info-custom mb-4" role="alert">
                  <FiInfo size={20} className="me-2" />
                  <span>
                    Leave the password field blank to keep the current password
                    unchanged.
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="row g-4">
                    {/* Username */}
                    <div className="col-12">
                      <label htmlFor="username" className="form-label">
                        <FiUser size={16} className="me-2" />
                        Username <span className="required-mark">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="col-12">
                      <label htmlFor="email" className="form-label">
                        <FiMail size={16} className="me-2" />
                        Email Address <span className="required-mark">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-custom"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="col-12">
                      <label htmlFor="password" className="form-label">
                        <FiLock size={16} className="me-2" />
                        New Password{" "}
                        <span className="optional-text">
                          (leave blank to keep current)
                        </span>
                      </label>
                      <div className="input-group">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control form-control-custom"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter new password or leave blank"
                        />
                        <button
                          className="btn btn-outline-secondary btn-eye"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <i className="bi bi-eye-slash"></i>
                          ) : (
                            <i className="bi bi-eye"></i>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="col-md-6">
                      <label htmlFor="contact_number" className="form-label">
                        <FiPhone size={16} className="me-2" />
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        className="form-control form-control-custom"
                        id="contact_number"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleChange}
                        placeholder="Enter contact number"
                      />
                    </div>

                    {/* ID Number */}
                    <div className="col-md-6">
                      <label htmlFor="id_number" className="form-label">
                        <FiCreditCard size={16} className="me-2" />
                        ID Number
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        id="id_number"
                        name="id_number"
                        value={formData.id_number}
                        onChange={handleChange}
                        placeholder="Enter ID number"
                      />
                    </div>

                    {/* Address */}
                    <div className="col-12">
                      <label htmlFor="address" className="form-label">
                        <FiMapPin size={16} className="me-2" />
                        Address
                      </label>
                      <textarea
                        className="form-control form-control-custom"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Enter full address"
                        rows="3"
                      ></textarea>
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
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Updating User...
                        </>
                      ) : (
                        <>
                          <FiEdit size={18} className="me-2" />
                          Update User
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
        .edit-user-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Loading State */
        .loading-container {
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

        .optional-text {
          color: #1976D2;
          font-size: 0.85rem;
          font-weight: normal;
          font-style: italic;
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

        textarea.form-control-custom {
          resize: vertical;
          min-height: 100px;
        }

        /* Password Toggle Button */
        .btn-eye {
          border: 2px solid #BBDEFB;
          border-left: none;
          border-radius: 0 12px 12px 0;
          color: #1976D2;
          background: #F5F5F5;
          transition: all 0.3s ease;
          padding: 12px 16px;
        }

        .btn-eye:hover {
          background: #E3F2FD;
          color: #1565C0;
          border-color: #2196F3;
          border-left: none;
        }

        .btn-eye:focus {
          box-shadow: none;
          border-color: #2196F3;
          border-left: none;
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

        .alert-info-custom {
          background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
          border: 1px solid #81D4FA;
          border-left: 4px solid #2196F3;
          color: #01579B;
          border-radius: 12px;
          display: flex;
          align-items: flex-start;
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

export default EditUser;