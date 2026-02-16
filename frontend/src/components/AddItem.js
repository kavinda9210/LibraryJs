import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AddItem() {
  const [formData, setFormData] = useState({
    itam_no: "",
    itam_name: "",
    price_per_one: "",
    quantity: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ API call to add item
      await axios.post("http://localhost:5000/itam", formData);

      // ✅ Success message
      alert("Item added successfully!");

      // ✅ Go to ItemManagement page
      navigate("/itam-management");

    } catch (err) {
      setError("Failed to add item. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/itam-management");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Add New Item</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Item Number:</label>
            <input
              type="text"
              name="itam_no"
              value={formData.itam_no}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="e.g., ITM-001"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Item Name:</label>
            <input
              type="text"
              name="itam_name"
              value={formData.itam_name}
              onChange={handleChange}
              style={styles.input}
              required
              placeholder="Enter item name"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Price per One:</label>
            <input
              type="number"
              name="price_per_one"
              value={formData.price_per_one}
              onChange={handleChange}
              style={styles.input}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Quantity:</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              style={styles.input}
              required
              min="0"
              placeholder="0"
            />
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={handleCancel}
              style={{ ...styles.button, ...styles.cancelButton }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...styles.submitButton }}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    backgroundColor: "white",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "500px"
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#333"
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "20px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  },
  label: {
    fontWeight: "bold",
    color: "#555",
    marginBottom: "5px"
  },
  input: {
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    fontSize: "16px"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    marginTop: "20px"
  },
  button: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "background-color 0.3s"
  },
  cancelButton: {
    backgroundColor: "#757575",
    color: "white"
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    color: "white"
  }
};

export default AddItem;
