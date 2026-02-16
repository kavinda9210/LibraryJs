import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBox,
  FiTrendingUp,
  FiTrendingDown,
  FiLogOut,
} from "react-icons/fi";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <h2 style={styles.appTitle}>Library & Inventory System</h2>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Welcome */}
      <div style={styles.welcomeBox}>
        <h1 style={styles.welcomeTitle}>User Dashboard</h1>
        <p style={styles.welcomeText}>
          Manage library items, income, and outgoing records efficiently.
        </p>
      </div>

      {/* Cards */}
      <div style={styles.cardGrid}>
        <div
          style={{ ...styles.card, borderTop: "5px solid #2563eb" }}
          onClick={() => navigate("/itam-management")}
        >
          <FiBox size={34} style={{ color: "#2563eb" }} />
          <h3 style={styles.cardTitle}>Item Management</h3>
          <p style={styles.cardText}>
            Manage books, assets, and inventory stock.
          </p>
        </div>

        <div
          style={{ ...styles.card, borderTop: "5px solid #16a34a" }}
          onClick={() => navigate("/income-management")}
        >
          <FiTrendingUp size={34} style={{ color: "#16a34a" }} />
          <h3 style={styles.cardTitle}>Income Management</h3>
          <p style={styles.cardText}>
            Track income, payments, and financial records.
          </p>
        </div>

        <div
          style={{ ...styles.card, borderTop: "5px solid #dc2626" }}
          onClick={() => navigate("/outgoing-management")}
        >
          <FiTrendingDown size={34} style={{ color: "#dc2626" }} />
          <h3 style={styles.cardTitle}>Outgoing Management</h3>
          <p style={styles.cardText}>
            Monitor expenses, purchases, and outgoing costs.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={styles.footer}>
        © {new Date().getFullYear()} Library & Inventory Management System
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 10% 10%, #e7f0ff 0%, transparent 60%), radial-gradient(900px 600px at 90% 30%, #ffe8ec 0%, transparent 55%), #f5f6fa",
    padding: 24,
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
  },

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "14px 20px",
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: 30,
  },

  appTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 800,
    color: "#1f2937",
  },

  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },

  welcomeBox: {
    textAlign: "center",
    marginBottom: 30,
  },

  welcomeTitle: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#111827",
  },

  welcomeText: {
    marginTop: 6,
    color: "#6b7280",
    fontSize: 15,
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    maxWidth: 900,
    margin: "0 auto",
  },

  card: {
    background: "#ffffff",
    borderRadius: 18,
    padding: 22,
    boxShadow: "0 15px 35px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },

  cardTitle: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
  },

  cardText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: "20px",
  },

  footer: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 12,
    color: "#6b7280",
  },
};

export default Dashboard;
