import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const goToUserManagement = () => {
    navigate("/user-management"); // Redirect to user management page
  };

  const goToItemManagement = () => {
    navigate("/item-management"); // Redirect to item management page
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin!</p>
      
      <div style={styles.buttonContainer}>
        <button 
          style={styles.button} 
          onClick={goToUserManagement}
        >
          User Management
        </button>
        
        <button 
          style={styles.button} 
          onClick={goToItemManagement}
        >
          Item Management
        </button>
        <button className="btn btn-warning" onClick={() => navigate("/admin-income-approval")}>
  Pending Income Approvals
</button>
      </div>
    </div>
  );
}

const styles = {
  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    maxWidth: "300px",
    marginTop: "30px",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    cursor: "pointer",
    color: "white",
    border: "none",
    borderRadius: "5px",
    transition: "all 0.3s ease",
  },
  userButton: {
    backgroundColor: "#28a745",
  },
  itemButton: {
    backgroundColor: "#007bff",
  },
};

// Apply specific colors to each button
styles.button = {
  ...styles.button,
  ...styles.userButton,
};

export default AdminDashboard;