import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

/**
 * AddOutgoing page
 * Route: /add-outgoing
 * - Item dropdown loads from /itam/
 * - Saves via POST /outgoing/ (backend auto-calculates sell_price, updates stock, and generates PDF bill)
 * - sell_price is automatically calculated as: price_per_one * qty
 * - Shows calculated sell price in real-time
 */
function AddOutgoing() {
  const navigate = useNavigate();

  const [itams, setItams] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [form, setForm] = useState({
    date: "",
    buy_company: "",
    bill_number: "",
    itam_name: "",
    qty: "",
    buy_price: "",
  });

  // State to hold the selected item's price_per_one
  const [selectedItemPrice, setSelectedItemPrice] = useState(0);
  const [calculatedSellPrice, setCalculatedSellPrice] = useState(0);

  useEffect(() => {
    const fetchItams = async () => {
      try {
        setLoadingItems(true);
        const res = await axios.get("http://localhost:5000/itam/");
        setItams(res.data || []);
      } catch (e) {
        console.error(e);
        alert("Failed to load items");
      } finally {
        setLoadingItems(false);
      }
    };
    fetchItams();
  }, []);

  // Calculate sell price whenever item or quantity changes
  useEffect(() => {
    if (selectedItemPrice > 0 && form.qty > 0) {
      const sellPrice = selectedItemPrice * Number(form.qty);
      setCalculatedSellPrice(sellPrice);
    } else {
      setCalculatedSellPrice(0);
    }
  }, [selectedItemPrice, form.qty]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));

    // If item selection changed, update the price_per_one
    if (name === "itam_name") {
      const selectedItem = itams.find((itam) => itam.itam_name === value);
      if (selectedItem) {
        setSelectedItemPrice(selectedItem.price_per_one);
      } else {
        setSelectedItemPrice(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.date ||
      !form.buy_company ||
      !form.bill_number ||
      !form.itam_name ||
      form.qty === "" ||
      form.buy_price === ""
    ) {
      alert("Please fill all fields");
      return;
    }

    try {
      const payload = {
        ...form,
        qty: Number(form.qty),
        buy_price: Number(form.buy_price),
      };

      const res = await axios.post("http://localhost:5000/outgoing/", payload);

      // Download the generated bill
      if (res.data.bill_url) {
        const billUrl = `http://localhost:5000${res.data.bill_url}`;
        window.open(billUrl, "_blank");
      }

      alert(
        `✅ Saved successfully!\n\nSell Price: ${res.data.sell_price}\nBalance: ${res.data.balance}\nProfit: ${res.data.profit}\n\nBill has been generated and will download automatically.`
      );
      
      navigate("/outgoing-management");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to add outgoing record");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Add Outgoing</h1>

      <button style={styles.backButton} onClick={() => navigate("/outgoing-management")}>
        ← Back
      </button>

      <form style={styles.form} onSubmit={handleSubmit}>
        <label style={styles.label}>Date</label>
        <input style={styles.input} type="date" name="date" value={form.date} onChange={handleChange} />

        <label style={styles.label}>Customer / Buy Company</label>
        <input style={styles.input} name="buy_company" value={form.buy_company} onChange={handleChange} />

        <label style={styles.label}>Bill Number</label>
        <input style={styles.input} name="bill_number" value={form.bill_number} onChange={handleChange} />

        <label style={styles.label}>Item (ITAM)</label>
        <select style={styles.input} name="itam_name" value={form.itam_name} onChange={handleChange} disabled={loadingItems}>
          <option value="">
            {loadingItems ? "Loading items..." : "Select an item"}
          </option>
          {itams.map((itam) => (
            <option key={itam.itam_id} value={itam.itam_name}>
              {itam.itam_name} (Stock: {itam.quantity}, Price: {itam.price_per_one})
            </option>
          ))}
        </select>

        <label style={styles.label}>Quantity</label>
        <input style={styles.input} type="number" min="1" name="qty" value={form.qty} onChange={handleChange} />

        <label style={styles.label}>Buy Price (Cost per unit)</label>
        <input style={styles.input} type="number" step="0.01" min="0" name="buy_price" value={form.buy_price} onChange={handleChange} />

        {/* Calculated Sell Price Display */}
        {calculatedSellPrice > 0 && (
          <div style={styles.calculationBox}>
            <div style={styles.calculationRow}>
              <span style={styles.calculationLabel}>Unit Price:</span>
              <span style={styles.calculationValue}>{selectedItemPrice.toFixed(2)}</span>
            </div>
            <div style={styles.calculationRow}>
              <span style={styles.calculationLabel}>Quantity:</span>
              <span style={styles.calculationValue}>{form.qty}</span>
            </div>
            <div style={styles.divider}></div>
            <div style={styles.calculationRow}>
              <span style={styles.calculationLabelBold}>Total Sell Price:</span>
              <span style={styles.calculationValueBold}>{calculatedSellPrice.toFixed(2)}</span>
            </div>
            {form.buy_price && (
              <div style={styles.calculationRow}>
                <span style={styles.calculationLabel}>Expected Profit:</span>
                <span style={{...styles.calculationValue, color: '#4CAF50', fontWeight: 'bold'}}>
                  {(calculatedSellPrice - (Number(form.buy_price) * Number(form.qty))).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={styles.infoBox}>
          <small>
            ℹ️ Sell price will be automatically calculated based on the item's price_per_one × quantity
          </small>
        </div>

        <button style={styles.saveButton} type="submit">
          💾 Save Outgoing & Generate Bill
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { maxWidth: 520, margin: "40px auto", padding: 20, fontFamily: "Arial, sans-serif", border: "1px solid #ddd", borderRadius: 10, backgroundColor: "#fff" },
  title: { textAlign: "center", marginBottom: 10 },
  backButton: { backgroundColor: "#555", color: "white", border: "none", padding: "8px 12px", cursor: "pointer", borderRadius: 5, marginBottom: 15 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { fontWeight: "bold", marginTop: 6 },
  input: { padding: 10, fontSize: 15, borderRadius: 6, border: "1px solid #ccc" },
  infoBox: { backgroundColor: "#e7f3ff", padding: 10, borderRadius: 6, border: "1px solid #b3d9ff", marginTop: 5 },
  calculationBox: { 
    backgroundColor: "#f0f8f0", 
    padding: 15, 
    borderRadius: 8, 
    border: "2px solid #4CAF50",
    marginTop: 10,
    marginBottom: 5
  },
  calculationRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8
  },
  calculationLabel: {
    fontSize: 14,
    color: "#555"
  },
  calculationValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500"
  },
  calculationLabelBold: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  calculationValueBold: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50"
  },
  divider: {
    height: 1,
    backgroundColor: "#4CAF50",
    margin: "10px 0"
  },
  saveButton: { marginTop: 10, backgroundColor: "#4CAF50", color: "white", border: "none", padding: "12px 14px", cursor: "pointer", borderRadius: 6, fontSize: 16 },
};

export default AddOutgoing;