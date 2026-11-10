import React, { useState, useMemo, useEffect } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiEye, FiEyeOff, FiShield, FiArrowLeft } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === 'user') {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const canSubmit = useMemo(() => {
    return username.trim() && password.trim() && !loading;
  }, [username, password, loading]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiClient.post("/admin/login", {
        username: username.trim(),
        password,
      });

      if (res.data.success) {
        // Create admin user object with role and token
        const adminData = {
          ...res.data.admin,
          role: 'admin',
          username: username.trim(),
        };

        // Use the login function from AuthContext with token
        login(adminData, res.data.token);

        // Navigate to admin dashboard
        navigate("/admin-dashboard", { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="admin-login-page">
      {/* Back to Home Button */}
      <div className="position-fixed top-0 start-0 p-3 p-md-4" style={{ zIndex: 10 }}>
        <button className="btn btn-back shadow" onClick={handleBackToHome}>
          <FiArrowLeft size={18} className="me-2" />
          Back to Login
        </button>
      </div>

      <div className="container-fluid h-100">
        <div className="row h-100 align-items-center justify-content-center">
          <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4">
            {/* Admin Login Card */}
            <div className="card admin-card shadow-lg">
              <div className="card-body p-4 p-md-5">
                {/* Admin Icon and Title */}
                <div className="text-center mb-4">
                  <div className="admin-icon-wrapper mb-3">
                    <FiShield size={48} className="admin-icon" />
                  </div>
                  <h1 className="admin-title mb-2">Administrator Access</h1>
                  <p className="admin-subtitle">
                    Authorized Personnel Only
                  </p>
                  <div className="title-divider"></div>
                </div>

                {/* Security Notice */}
                <div className="alert alert-warning-custom mb-4" role="alert">
                  <i className="bi bi-shield-exclamation me-2"></i>
                  This area is restricted to authorized administrators only.
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errorMsg}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setErrorMsg("")}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleAdminLogin}>
                  <div className="mb-3">
                    <label htmlFor="admin-username" className="form-label">
                      <i className="bi bi-person-badge me-2"></i>
                      Administrator Username
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-admin"
                      id="admin-username"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="admin-password" className="form-label">
                      <i className="bi bi-key me-2"></i>
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-admin"
                        id="admin-password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        className="btn btn-outline-secondary btn-eye-admin"
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-admin-login w-100"
                    disabled={!canSubmit}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <FiShield size={18} className="me-2" />
                        Access Admin Panel
                      </>
                    )}
                  </button>
                </form>

                {/* Security Footer */}
                <div className="security-footer text-center mt-4">
                  <small className="text-muted">
                    <i className="bi bi-shield-lock me-1"></i>
                    Secure connection established
                  </small>
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="text-center mt-3">
              <p className="warning-text">
                <i className="bi bi-exclamation-circle me-2"></i>
                Unauthorized access attempts will be logged
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-login-page {
          min-height: 100vh;
          background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.15) 0%,
              rgba(25, 118, 210, 0.1) 100%
            ),
            linear-gradient(
              45deg,
              #0D47A1 0%,
              #1565C0 25%,
              #1976D2 50%,
              #1565C0 75%,
              #0D47A1 100%
            );
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px 0;
          position: relative;
          overflow: hidden;
        }

        .admin-login-page::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(
            circle,
            rgba(33, 150, 243, 0.1) 0%,
            transparent 70%
          );
          animation: rotate 30s linear infinite;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Back Button */
        .btn-back {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: #E3F2FD;
          font-weight: 600;
          padding: 10px 18px;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          transform: translateX(-3px);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Admin Card */
        .admin-card {
          border: none;
          border-radius: 24px;
          background: linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(227, 242, 253, 0.95) 100%
          );
          box-shadow: 0 20px 60px rgba(33, 150, 243, 0.4),
            0 0 1px rgba(33, 150, 243, 0.5);
          animation: fadeInUp 0.6s ease-out;
          overflow: hidden;
          position: relative;
          backdrop-filter: blur(10px);
        }

        .admin-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 6px;
          background: linear-gradient(
            90deg,
            #2196F3 0%,
            #42A5F5 25%,
            #64B5F6 50%,
            #42A5F5 75%,
            #2196F3 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Admin Icon */
        .admin-icon-wrapper {
          display: inline-block;
          padding: 20px;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border-radius: 50%;
          box-shadow: 0 8px 24px rgba(33, 150, 243, 0.4);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            box-shadow: 0 8px 24px rgba(33, 150, 243, 0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(33, 150, 243, 0.5);
          }
        }

        .admin-icon {
          color: #FFFFFF;
          display: block;
        }

        /* Title Styles */
        .admin-title {
          color: #1565C0;
          font-weight: 800;
          font-size: 1.85rem;
          letter-spacing: -0.5px;
        }

        .admin-subtitle {
          color: #1976D2;
          font-size: 0.95rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .title-divider {
          width: 60px;
          height: 3px;
          background: linear-gradient(90deg, #2196F3 0%, #1976D2 100%);
          margin: 12px auto 0;
          border-radius: 2px;
        }

        @media (max-width: 768px) {
          .admin-title {
            font-size: 1.5rem;
          }
          .admin-subtitle {
            font-size: 0.85rem;
          }
        }

        /* Alert Warning Custom */
        .alert-warning-custom {
          background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%);
          border: 1px solid #FFF176;
          border-left: 4px solid #FBC02D;
          color: #F57F17;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Form Styles */
        .form-label {
          color: #1565C0;
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-control-admin {
          border: 2px solid #BBDEFB;
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #F5F5F5;
        }

        .form-control-admin:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.25rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .btn-eye-admin {
          border: 2px solid #BBDEFB;
          border-left: none;
          border-radius: 0 12px 12px 0;
          color: #1976D2;
          background: #F5F5F5;
          transition: all 0.3s ease;
        }

        .btn-eye-admin:hover {
          background: #E3F2FD;
          color: #1565C0;
          border-color: #2196F3;
          border-left: none;
        }

        .btn-eye-admin:focus {
          box-shadow: none;
          border-color: #2196F3;
          border-left: none;
        }

        /* Admin Login Button */
        .btn-admin-login {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 15px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .btn-admin-login::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .btn-admin-login:hover:not(:disabled)::before {
          width: 300px;
          height: 300px;
        }

        .btn-admin-login:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(33, 150, 243, 0.5);
          color: #FFFFFF;
        }

        .btn-admin-login:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .btn-admin-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Security Footer */
        .security-footer {
          padding-top: 12px;
          border-top: 1px solid #BBDEFB;
        }

        .security-footer small {
          color: #1976D2;
          font-weight: 500;
        }

        /* Warning Text */
        .warning-text {
          color: #E3F2FD;
          font-size: 0.85rem;
          font-weight: 500;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        /* Alert Danger Override */
        .alert-danger {
          background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
          border: 1px solid #EF9A9A;
          border-left: 4px solid #F44336;
          color: #C62828;
          border-radius: 12px;
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive Adjustments */
        @media (max-width: 576px) {
          .admin-card .card-body {
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminLogin;