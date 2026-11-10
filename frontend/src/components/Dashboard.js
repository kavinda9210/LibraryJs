import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
  FiLogOut,
  FiUser,
  FiActivity,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Get user name from Auth Context
    if (user) {
      setUserName(user.name || user.username || "User");
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout(); // Clear auth context and localStorage
      navigate("/", { replace: true });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="dashboard">
      {/* Top Navigation Bar */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="nav-icon me-3">
                  <FiActivity size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">
                    Library & Inventory System
                  </h5>
                  <small className="nav-subtitle">
                    Library Service Board - Central Province
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-logout" onClick={handleLogout}>
                <FiLogOut size={18} className="me-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {/* Welcome Section */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card welcome-card shadow-lg">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <div className="d-flex align-items-center mb-3">
                      <div className="user-avatar me-3">
                        <FiUser size={28} />
                      </div>
                      <div>
                        <h2 className="welcome-title mb-1">
                          Welcome back, {userName}!
                        </h2>
                        <p className="welcome-text mb-0">
                          <FiActivity className="me-2" />
                          Manage library items, income, and outgoing records
                          efficiently
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <div className="time-display">
                      <div className="time">{formatTime(currentTime)}</div>
                      <div className="date">{formatDate(currentTime)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management Cards */}
        <div className="row">
          <div className="col-12 mb-4">
            <h4 className="section-title">
              <FiActivity className="me-2" />
              Quick Access
            </h4>
          </div>

          {/* Item Management Card */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div
              className="card management-card shadow-lg"
              onClick={() => navigate("/itam-management")}
            >
              <div className="card-body p-4">
                <div className="management-icon management-icon-items mb-3">
                  <FiPackage size={32} />
                </div>
                <h5 className="management-title mb-2">Item Management</h5>
                <p className="management-description mb-0">
                  Manage books, assets, and inventory stock levels efficiently.
                </p>
              </div>
              <div className="card-footer-custom">
                <span className="card-link">
                  Access Items
                  <span className="arrow">→</span>
                </span>
              </div>
            </div>
          </div>

          {/* Income Management Card */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div
              className="card management-card shadow-lg"
              onClick={() => navigate("/income-management")}
            >
              <div className="card-body p-4">
                <div className="management-icon management-icon-income mb-3">
                  <FiTrendingUp size={32} />
                </div>
                <h5 className="management-title mb-2">Income Management</h5>
                <p className="management-description mb-0">
                  Track income, payments, and financial records systematically.
                </p>
              </div>
              <div className="card-footer-custom">
                <span className="card-link">
                  Access Income
                  <span className="arrow">→</span>
                </span>
              </div>
            </div>
          </div>

          {/* Outgoing Management Card */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div
              className="card management-card shadow-lg"
              onClick={() => navigate("/outgoing-management")}
            >
              <div className="card-body p-4">
                <div className="management-icon management-icon-outgoing mb-3">
                  <FiTrendingDown size={32} />
                </div>
                <h5 className="management-title mb-2">Outgoing Management</h5>
                <p className="management-description mb-0">
                  Monitor expenses, purchases, and outgoing costs effectively.
                </p>
              </div>
              <div className="card-footer-custom">
                <span className="card-link">
                  Access Outgoing
                  <span className="arrow">→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-5 pb-4">
        <p className="footer-text mb-0">
          © {new Date().getFullYear()} Library Service Board - Central Province
        </p>
      </div>

      <style>{`
        .dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Top Navigation */
        .top-nav {
          background: linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%);
          border-bottom: 3px solid #2196F3;
        }

        .nav-icon {
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

        .btn-logout {
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
        }

        .btn-logout:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
          background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
          color: #FFFFFF;
        }

        /* Welcome Card */
        .welcome-card {
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%);
          border-left: 5px solid #2196F3;
          animation: fadeIn 0.6s ease-out;
        }

        .user-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .welcome-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.75rem;
        }

        .welcome-text {
          color: #1976D2;
          font-size: 1rem;
          font-weight: 500;
        }

        .time-display {
          text-align: right;
        }

        .time-display .time {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1565C0;
          font-family: "Courier New", monospace;
        }

        .time-display .date {
          font-size: 0.85rem;
          color: #1976D2;
          font-weight: 500;
        }

        /* Section Title */
        .section-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.35rem;
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        /* Management Cards */
        .management-card {
          border: none;
          border-radius: 18px;
          background: #FFFFFF;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          height: 100%;
        }

        .management-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #2196F3 0%, #1976D2 100%);
        }

        .management-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px rgba(33, 150, 243, 0.3) !important;
        }

        .management-icon {
          width: 70px;
          height: 70px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          transition: all 0.3s ease;
        }

        .management-icon-items {
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
        }

        .management-icon-income {
          background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
          box-shadow: 0 4px 12px rgba(102, 187, 106, 0.3);
        }

        .management-icon-outgoing {
          background: linear-gradient(135deg, #EF5350 0%, #F44336 100%);
          box-shadow: 0 4px 12px rgba(239, 83, 80, 0.3);
        }

        .management-card:hover .management-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .management-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .management-description {
          color: #546E7A;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .card-footer-custom {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border-top: 2px solid #90CAF9;
          padding: 14px 20px;
        }

        .card-link {
          color: #1565C0;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s ease;
        }

        .arrow {
          font-size: 1.2rem;
          transition: transform 0.3s ease;
          color: #2196F3;
        }

        .management-card:hover .arrow {
          transform: translateX(5px);
        }

        .management-card:hover .card-link {
          color: #0D47A1;
        }

        /* Footer */
        .footer-text {
          color: #1976D2;
          font-size: 0.85rem;
          font-weight: 500;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
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

          .welcome-title {
            font-size: 1.35rem;
          }

          .time-display {
            text-align: left;
            margin-top: 15px;
          }

          .time-display .time {
            font-size: 1.25rem;
          }

          .section-title {
            font-size: 1.2rem;
          }

          .user-avatar {
            width: 50px;
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;