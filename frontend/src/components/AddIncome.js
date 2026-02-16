import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
        const res = await axios.get("http://localhost:5000/itam/");
        setItams(res.data || []);
      } catch (err) {
        console.error("Failed to load items:", err);
        alert("Failed to load items for dropdown");
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
      alert("Please fill all fields");
      return;
    }

    try {
      // Convert numbers
      const payload = {
        ...form,
        qty: Number(form.qty),
        buy_price: Number(form.buy_price),
      };

      await axios.post("http://localhost:5000/income/", payload);

      alert("Income record added successfully!");
      navigate("/income-management");
    } catch (err) {
      console.error("Failed to add income:", err);
      alert("Failed to add income record");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Add Income</h1>

      <button style={styles.backButton} onClick={() => navigate("/income-management")}>
        ← Back
      </button>

      <form style={styles.form} onSubmit={handleSubmit}>
        {/* Date */}
        <label style={styles.label}>Date</label>
        <input
          style={styles.input}
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
        />

        {/* Supply Company */}
        <label style={styles.label}>Supply Company</label>
        <input
          style={styles.input}
          type="text"
          name="supply_company"
          placeholder="Supply company name"
          value={form.supply_company}
          onChange={handleChange}
        />

        {/* Bill Number */}
        <label style={styles.label}>Bill Number</label>
        <input
          style={styles.input}
          type="text"
          name="bill_number"
          placeholder="Bill number"
          value={form.bill_number}
          onChange={handleChange}
        />

        {/* ITAM Dropdown */}
        <label style={styles.label}>Item (ITAM)</label>
        <select
          style={styles.input}
          name="itam_name"
          value={form.itam_name}
          onChange={handleChange}
          disabled={loadingItems}
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

        {/* Qty */}
        <label style={styles.label}>Quantity</label>
        <input
          style={styles.input}
          type="number"
          name="qty"
          placeholder="Qty"
          value={form.qty}
          onChange={handleChange}
          min="1"
        />

        {/* Buy Price */}
        <label style={styles.label}>Buy Price</label>
        <input
          style={styles.input}
          type="number"
          step="0.01"
          name="buy_price"
          placeholder="Buy price"
          value={form.buy_price}
          onChange={handleChange}
          min="0"
        />

        <button style={styles.saveButton} type="submit">
          Save Income
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "520px",
    margin: "40px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    border: "1px solid #ddd",
    borderRadius: "10px",
    backgroundColor: "#fff",
  },
  title: {
    marginBottom: "10px",
    textAlign: "center",
  },
  backButton: {
    backgroundColor: "#555",
    color: "white",
    border: "none",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "5px",
    marginBottom: "15px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: {
    fontWeight: "bold",
    marginTop: "6px",
  },
  input: {
    padding: "10px",
    fontSize: "15px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  saveButton: {
    marginTop: "10px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    padding: "12px 14px",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "16px",
  },
};

export default AddIncome;
