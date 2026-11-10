import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function Welcome() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  const handleAdminPage = () => navigate("/admin");

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await apiClient.post("/api/auth/login", {
        username: username.trim(),
        password,
      });

      if (res.data?.user) {
        const userData = {
          ...res.data.user,
          role: res.data.user.role || 'user',
          username: username.trim(),
        };

        login(userData, res.data.token);

        if (userData.role === 'admin') {
          navigate("/admin-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-page">
      {/* Top Bar with Admin Button */}
      <div className="position-fixed top-0 end-0 p-3 p-md-4" style={{ zIndex: 10 }}>
        <button className="btn btn-admin shadow-lg" onClick={handleAdminPage}>
          <i className="bi bi-shield-lock me-2"></i>
          Admin Login
        </button>
      </div>

      <div className="container-fluid h-100">
        <div className="row h-100 align-items-center justify-content-center">
          <div className="col-12 col-md-10 col-lg-8 col-xl-6">
            {/* Logo Header Section */}
            <div className="logo-header mb-4 mb-md-5">
              <div className="row align-items-center justify-content-between">
                <div className="col-3 text-center">
                  <img
                    src="/photos/clogo.png"
                    alt="Central Province Logo"
                    className="logo-side img-fluid"
                  />
                </div>
                <div className="col-6 text-center">
                  <img
                    src="/photos/images-removebg-preview.png"
                    alt="Library Service Board Logo"
                    className="logo-main img-fluid"
                  />
                </div>
                <div className="col-3 text-center">
                  <img
                    src="/photos/l-logo.png"
                    alt="Library Logo"
                    className="logo-side img-fluid"
                  />
                </div>
              </div>
            </div>

            {/* Login Card */}
            <div className="card login-card shadow-lg">
              <div className="card-body p-4 p-md-5">
                {/* Title Section */}
                <div className="text-center mb-4">
                  <h1 className="card-title mb-2">
                    Welcome to Inventory Management System
                  </h1>
                  <p className="card-subtitle text-muted">
                    Library Service Board - Central Province
                  </p>
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
                <form onSubmit={handleUserLogin}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">
                      Username
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      id="username"
                      placeholder="Enter username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-custom"
                        id="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        className="btn btn-outline-secondary btn-eye"
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
                    className="btn btn-login w-100"
                    disabled={!canSubmit}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Login
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="footer-text mb-0">
                © {new Date().getFullYear()} Library Service Board - Central Province
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .welcome-page {
          min-height: 100vh;
          background: linear-gradient(
              135deg,
              rgba(33, 150, 243, 0.05) 0%,
              rgba(227, 242, 253, 0.3) 50%,
              rgba(25, 118, 210, 0.05) 100%
            ),
            #E3F2FD;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px 0;
        }

        /* Logo Styles */
        .logo-header {
          animation: fadeInDown 0.8s ease-out;
        }

        .logo-main {
          max-height: 140px;
          filter: drop-shadow(0 4px 10px rgba(33, 150, 243, 0.2));
          transition: transform 0.3s ease;
        }

        .logo-main:hover {
          transform: scale(1.05);
        }

        .logo-side {
          max-height: 90px;
          filter: drop-shadow(0 2px 6px rgba(33, 150, 243, 0.15));
          transition: transform 0.3s ease;
        }

        .logo-side:hover {
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .logo-main {
            max-height: 90px;
          }
          .logo-side {
            max-height: 60px;
          }
        }

        /* Card Styles */
        .login-card {
          border: none;
          border-radius: 20px;
          background: #FFFFFF;
          box-shadow: 0 10px 40px rgba(33, 150, 243, 0.15);
          animation: fadeInUp 0.8s ease-out;
          overflow: hidden;
          position: relative;
        }

        .login-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(
            90deg,
            #2196F3 0%,
            #1976D2 50%,
            #2196F3 100%
          );
        }

        .card-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.75rem;
          line-height: 1.3;
        }

        .card-subtitle {
          color: #1976D2;
          font-size: 1rem;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .card-title {
            font-size: 1.4rem;
          }
          .card-subtitle {
            font-size: 0.9rem;
          }
        }

        /* Form Styles */
        .form-label {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
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
          box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .btn-eye {
          border: 2px solid #BBDEFB;
          border-left: none;
          border-radius: 0 12px 12px 0;
          color: #1976D2;
          background: #F5F5F5;
          transition: all 0.3s ease;
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

        /* Button Styles */
        .btn-login {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          color: #FFFFFF;
        }

        .btn-login:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn-login:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-admin {
          background: linear-gradient(135deg, #1976D2 0%, #2196F3 100%);
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-admin:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          background: linear-gradient(135deg, #1565C0 0%, #1976D2 100%);
          color: #FFFFFF;
        }

        /* Footer */
        .footer-text {
          color: #1976D2;
          font-size: 0.85rem;
          font-weight: 500;
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

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Alert Danger Override */
        .alert-danger {
          background: linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%);
          border: 1px solid #EF9A9A;
          border-left: 4px solid #F44336;
          color: #C62828;
          border-radius: 12px;
        }

        /* Responsive Adjustments */
        @media (max-width: 576px) {
          .login-card .card-body {
            padding: 2rem 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Welcome;