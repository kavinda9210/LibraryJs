import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiLogOut,
  FiShield,
  FiActivity,
  FiDatabase,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminName, setAdminName] = useState("Administrator");

  useEffect(() => {
    // Get admin name from Auth Context
    if (user) {
      setAdminName(user.name || user.username || "Administrator");
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [user]);

  const goToUserManagement = () => {
    navigate("/user-management");
  };

  const goToItemManagement = () => {
    navigate("/item-management");
  };

  const goToIncomeApproval = () => {
    navigate("/admin-income-approval");
  };

  const goToDatabaseBackup = () => {
    navigate("/admin-backup");
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout(); // Clear auth context
      navigate("/admin", { replace: true });
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
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="admin-icon-small me-3">
                  <FiShield size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Admin Control Panel</h5>
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
                    <h2 className="welcome-title mb-2">
                      Welcome back, {adminName}!
                    </h2>
                    <p className="welcome-text mb-0">
                      <FiActivity className="me-2" />
                      You're logged in as System Administrator
                    </p>
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

        {/* Management Options Section */}
        <div className="row">
          <div className="col-12 mb-4">
            <h4 className="section-title">
              <FiShield className="me-2" />
              Management Tools
            </h4>
          </div>

          {/* User Management Card */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card management-card shadow-lg">
              <div className="card-body p-4">
                <div className="management-icon management-icon-users mb-3">
                  <FiUsers size={32} />
                </div>
                <h5 className="management-title mb-2">User Management</h5>
                <p className="management-description mb-4">
                  Add, edit, view, and manage user accounts. Control user
                  permissions and access levels.
                </p>
                <button
                  className="btn btn-management btn-users w-100"
                  onClick={goToUserManagement}
                >
                  <FiUsers size={18} className="me-2" />
                  Manage Users
                </button>
              </div>
            </div>
          </div>

          {/* Item Management Card */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card management-card shadow-lg">
              <div className="card-body p-4">
                <div className="management-icon management-icon-items mb-3">
                  <FiPackage size={32} />
                </div>
                <h5 className="management-title mb-2">Item Management</h5>
                <p className="management-description mb-4">
                  Manage inventory items, track stock levels, and update item
                  information in the system.
                </p>
                <button
                  className="btn btn-management btn-items w-100"
                  onClick={goToItemManagement}
                >
                  <FiPackage size={18} className="me-2" />
                  Manage Items
                </button>
              </div>
            </div>
          </div>

          {/* Income Approval Card */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card management-card shadow-lg">
              <div className="card-body p-4">
                <div className="management-icon management-icon-income mb-3">
                  <FiDollarSign size={32} />
                </div>
                <h5 className="management-title mb-2">Income Approvals</h5>
                <p className="management-description mb-4">
                  Review and approve pending income transactions and financial
                  records submitted by users.
                </p>
                <button
                  className="btn btn-management btn-income w-100"
                  onClick={goToIncomeApproval}
                >
                  <FiDollarSign size={18} className="me-2" />
                  View Approvals
                </button>
              </div>
            </div>
          </div>

          {/* Database Backup & Recovery Card */}
          <div className="col-lg-3 col-md-6 mb-4">
            <div className="card management-card shadow-lg">
              <div className="card-body p-4">
                <div className="management-icon management-icon-backup mb-3">
                  <FiDatabase size={32} />
                </div>
                <h5 className="management-title mb-2">Backup & Recovery</h5>
                <p className="management-description mb-4">
                  Auto & manual SQL backups, restore system, upload files, and
                  Windows Task Scheduler.
                </p>
                <button
                  className="btn btn-management btn-backup w-100"
                  onClick={goToDatabaseBackup}
                >
                  <FiDatabase size={18} className="me-2" />
                  Manage Backups
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Top Navigation */
        .top-nav {
          background: linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%);
          border-bottom: 3px solid #2196F3;
        }

        .admin-icon-small {
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
          margin: 0;
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

        /* Section Titles */
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

        .management-icon-users {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .management-icon-items {
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          box-shadow: 0 4px 12px rgba(66, 165, 245, 0.3);
        }

        .management-icon-income {
          background: linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%);
          box-shadow: 0 4px 12px rgba(100, 181, 246, 0.3);
        }

        .management-icon-backup {
          background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
          box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
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

        /* Management Buttons */
        .btn-management {
          border: none;
          border-radius: 12px;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 1rem;
          padding: 13px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-users {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
        }

        .btn-users:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
          background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
          color: #FFFFFF;
        }

        .btn-items {
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          box-shadow: 0 4px 15px rgba(66, 165, 245, 0.3);
        }

        .btn-items:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(66, 165, 245, 0.4);
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: #FFFFFF;
        }

        .btn-income {
          background: linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%);
          box-shadow: 0 4px 15px rgba(100, 181, 246, 0.3);
        }

        .btn-income:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(100, 181, 246, 0.4);
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          color: #FFFFFF;
        }

        .btn-backup {
          background: linear-gradient(135deg, #1E88E5 0%, #1565C0 100%);
          box-shadow: 0 4px 15px rgba(21, 101, 192, 0.3);
        }

        .btn-backup:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(21, 101, 192, 0.4);
          background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
          color: #FFFFFF;
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

          .nav-title {
            font-size: 1.1rem;
          }

          .section-title {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;