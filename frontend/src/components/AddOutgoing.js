import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiShoppingCart,
  FiArrowLeft,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiLayers,
  FiX,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function AddOutgoing() {
  const navigate = useNavigate();

  const [itams, setItams] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Bill header information
  const [billInfo, setBillInfo] = useState({
    date: new Date().toISOString().split('T')[0],
    buy_company: "",
    bill_number: "",
  });

  // Current item selection
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState("");

  // Cart (Bill Items)
  const [billItems, setBillItems] = useState([]);

  useEffect(() => {
    fetchItams();
  }, []);

  const fetchItams = async () => {
    try {
      setLoadingItems(true);
      const res = await apiClient.get("/itam");
      setItams(res.data || []);
    } catch (e) {
      console.error(e);
      setError("Failed to load items");
    } finally {
      setLoadingItems(false);
    }
  };

  // Handle item selection
  const handleItemSelect = (e) => {
    const itemName = e.target.value;
    const item = itams.find((i) => i.itam_name === itemName);
    setSelectedItem(item || null);
    setQuantity("");
  };

  // Add item to bill
  const handleAddToBill = () => {
    if (!selectedItem) {
      alert("Please select an item");
      return;
    }

    const qty = Number(quantity);
    const unitSell = Number(selectedItem.price_per_one || 0);
    const unitCost = Number(selectedItem.buy_price || 0);

    if (!qty || qty <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (qty > selectedItem.quantity) {
      alert(`Insufficient stock! Available: ${selectedItem.quantity}`);
      return;
    }

    // Automatically calculate selling price, total cost, and profit
    const sellPrice = unitSell * qty;
    const totalCost = unitCost * qty;
    const profit = sellPrice - totalCost;

    // Check if item already in bill
    const existingIndex = billItems.findIndex(
      (item) => item.itam_name === selectedItem.itam_name
    );

    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...billItems];
      const newQty = updatedItems[existingIndex].qty + qty;

      if (newQty > selectedItem.quantity) {
        alert(`Total quantity exceeds stock! Available: ${selectedItem.quantity}`);
        return;
      }

      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        qty: newQty,
        unit_price: unitSell,
        buy_price: unitCost,
        sell_price: unitSell * newQty,
        total_cost: unitCost * newQty,
        profit: (unitSell * newQty) - (unitCost * newQty),
      };

      setBillItems(updatedItems);
    } else {
      // Add new item
      const newItem = {
        itam_name: selectedItem.itam_name,
        unit_price: unitSell,
        qty: qty,
        buy_price: unitCost,
        sell_price: sellPrice,
        total_cost: totalCost,
        profit: profit,
        available_stock: selectedItem.quantity,
      };

      setBillItems([...billItems, newItem]);
    }

    // Reset selection
    setSelectedItem(null);
    setQuantity("");
    const selectElem = document.getElementById("item-select");
    if (selectElem) selectElem.value = "";
  };

  // Remove item from bill
  const removeItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalQty = 0;
    let totalSell = 0;
    let totalCost = 0;
    let totalProfit = 0;

    billItems.forEach((item) => {
      totalQty += item.qty;
      totalSell += item.sell_price;
      totalCost += item.total_cost;
      totalProfit += item.profit;
    });

    return { totalQty, totalSell, totalCost, totalProfit };
  };

  const totals = calculateTotals();

  // Submit bill
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!billInfo.date || !billInfo.buy_company || !billInfo.bill_number) {
      alert("Please fill all bill information");
      return;
    }

    if (billItems.length === 0) {
      alert("Please add at least one item to the bill");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        date: billInfo.date,
        buy_company: billInfo.buy_company,
        bill_number: billInfo.bill_number,
        items: billItems.map((item) => ({
          itam_name: item.itam_name,
          qty: item.qty,
          buy_price: item.buy_price,
        })),
      };

      const res = await apiClient.post("/outgoing", payload);

      if (res.data.bill_number) {
        try {
          const billRes = await apiClient.get(`/outgoing/bill/${encodeURIComponent(res.data.bill_number)}`, {
            responseType: "blob",
          });
          const url = window.URL.createObjectURL(new Blob([billRes.data], { type: "application/pdf" }));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `bill_${res.data.bill_number}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } catch (downloadErr) {
          console.error("Auto-download failed:", downloadErr);
        }
      }

      alert(
        `✅ Bill Created Successfully!\n\n` +
        `Total Items: ${totals.totalQty}\n` +
        `Total Amount: Rs. ${totals.totalSell.toFixed(2)}\n` +
        `Total Profit: Rs. ${totals.totalProfit.toFixed(2)}\n\n` +
        `Bill has been generated and download initiated.`
      );

      navigate("/outgoing-management");
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to create bill");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/outgoing-management");
  };

  return (
    <div className="add-outgoing-page">
      {/* Top Navigation */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiShoppingCart size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Point of Sale - Create Bill</h5>
                  <small className="nav-subtitle">Add items and generate invoice</small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back" onClick={handleCancel}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Outgoing
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-4">
        <div className="row g-4">
          {/* Left Side - Bill Information & Item Selection */}
          <div className="col-lg-7">
            {/* Bill Information Card */}
            <div className="card info-card shadow-sm mb-4">
              <div className="card-header">
                <FiFileText size={20} className="me-2" />
                <strong>Bill Information</strong>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <FiAlertCircle size={18} className="me-2" />
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError(null)}
                    ></button>
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      <FiCalendar size={14} className="me-2" />
                      Date
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={billInfo.date}
                      onChange={(e) =>
                        setBillInfo({ ...billInfo, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <FiFileText size={14} className="me-2" />
                      Bill Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., BILL-001"
                      value={billInfo.bill_number}
                      onChange={(e) =>
                        setBillInfo({ ...billInfo, bill_number: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      <FiUser size={14} className="me-2" />
                      Customer Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Customer name"
                      value={billInfo.buy_company}
                      onChange={(e) =>
                        setBillInfo({ ...billInfo, buy_company: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Item Card */}
            <div className="card add-item-card shadow-sm">
              <div className="card-header">
                <FiPackage size={20} className="me-2" />
                <strong>Add Item to Bill</strong>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="item-select">
                      <FiPackage size={14} className="me-2" />
                      Select Item
                    </label>
                    <select
                      id="item-select"
                      className="form-select form-select-lg"
                      onChange={handleItemSelect}
                      disabled={loadingItems}
                    >
                      <option value="">
                        {loadingItems ? "Loading items..." : "-- Choose an item --"}
                      </option>
                      {itams.map((item) => (
                        <option key={item.itam_id} value={item.itam_name}>
                          {item.itam_name} (Stock: {item.quantity} | Sell: Rs. {Number(item.price_per_one).toFixed(2)} | Cost: Rs. {Number(item.buy_price || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedItem && (
                    <>
                      <div className="col-12">
                        <div className="selected-item-info">
                          <div className="info-row">
                            <span className="info-label">Item Name:</span>
                            <span className="info-value">{selectedItem.itam_name}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">Available Stock:</span>
                            <span className="info-value stock">{selectedItem.quantity} units</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">
                              <FiDollarSign size={14} className="me-1" />
                              Unit Selling Price (Auto):
                            </span>
                            <span className="info-value price">
                              Rs. {Number(selectedItem.price_per_one || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">
                              <FiDollarSign size={14} className="me-1" />
                              Unit Cost Price (Auto):
                            </span>
                            <span className="info-value text-primary">
                              Rs. {Number(selectedItem.buy_price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label" htmlFor="quantity-input">
                          <FiLayers size={14} className="me-2" />
                          Quantity
                        </label>
                        <input
                          id="quantity-input"
                          type="number"
                          className="form-control form-control-lg"
                          placeholder="Enter quantity"
                          min="1"
                          max={selectedItem.quantity}
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                        <small className="text-muted">Available stock: {selectedItem.quantity} units</small>
                      </div>

                      {quantity && Number(quantity) > 0 && selectedItem && (
                        <div className="col-12">
                          <div className="calculation-preview">
                            <div className="preview-row">
                              <span>Auto-Calculated Selling Total:</span>
                              <span>
                                Rs. {(Number(selectedItem.price_per_one || 0) * Number(quantity)).toFixed(2)}
                              </span>
                            </div>
                            <div className="preview-row">
                              <span>Auto-Calculated Cost Total:</span>
                              <span>
                                Rs. {(Number(selectedItem.buy_price || 0) * Number(quantity)).toFixed(2)}
                              </span>
                            </div>
                            <div className="preview-row profit">
                              <span>Estimated Profit:</span>
                              <span
                                className={
                                  (Number(selectedItem.price_per_one || 0) - Number(selectedItem.buy_price || 0)) * Number(quantity) >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                Rs.{" "}
                                {(
                                  (Number(selectedItem.price_per_one || 0) - Number(selectedItem.buy_price || 0)) *
                                  Number(quantity)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="col-12">
                        <button
                          type="button"
                          className="btn btn-add-item w-100"
                          onClick={handleAddToBill}
                        >
                          <FiPlus size={20} className="me-2" />
                          Add to Bill
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Bill Preview */}
          <div className="col-lg-5">
            <div className="card bill-card shadow-lg sticky-top">
              <div className="card-header">
                <FiShoppingCart size={22} className="me-2" />
                <strong>Bill Preview ({billItems.length} items)</strong>
              </div>

              <div className="card-body p-0">
                {billItems.length === 0 ? (
                  <div className="empty-bill">
                    <FiShoppingCart size={60} />
                    <p className="mt-3 mb-0">No items added yet</p>
                    <small className="text-muted">Select items to create a bill</small>
                  </div>
                ) : (
                  <div className="bill-items">
                    {billItems.map((item, index) => (
                      <div key={index} className="bill-item">
                        <div className="item-header">
                          <h6 className="item-name">{item.itam_name}</h6>
                          <button
                            className="btn-remove-item"
                            onClick={() => removeItem(index)}
                          >
                            <FiX size={18} />
                          </button>
                        </div>
                        <div className="item-details">
                          <div className="detail-row">
                            <span>Quantity:</span>
                            <span>{item.qty} units</span>
                          </div>
                          <div className="detail-row">
                            <span>Unit Price:</span>
                            <span>Rs. {item.unit_price.toFixed(2)}</span>
                          </div>
                          <div className="detail-row">
                            <span>Cost/Unit:</span>
                            <span>Rs. {item.buy_price.toFixed(2)}</span>
                          </div>
                          <div className="detail-row total">
                            <span>Selling Total:</span>
                            <span>Rs. {item.sell_price.toFixed(2)}</span>
                          </div>
                          <div className="detail-row profit-row">
                            <span>Profit:</span>
                            <span className={item.profit >= 0 ? "profit-positive" : "profit-negative"}>
                              Rs. {item.profit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {billItems.length > 0 && (
                <>
                  <div className="bill-summary">
                    <div className="summary-row">
                      <span>Total Items:</span>
                      <span>{totals.totalQty}</span>
                    </div>
                    <div className="summary-row">
                      <span>Total Cost:</span>
                      <span>Rs. {totals.totalCost.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Total Selling:</span>
                      <span>Rs. {totals.totalSell.toFixed(2)}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="summary-row total-row">
                      <span>Total Profit:</span>
                      <span className={totals.totalProfit >= 0 ? "text-success" : "text-danger"}>
                        Rs. {totals.totalProfit.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <button
                      className="btn btn-generate-bill w-100"
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiCheckCircle size={20} className="me-2" />
                          Generate Bill
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .add-outgoing-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Top Navigation */
        .top-nav {
          background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
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
          color: #ffffff;
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
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        /* Cards */
        .info-card,
        .add-item-card {
          border: none;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
        }

        .card-header {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: #ffffff;
          padding: 16px 20px;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          border: none;
        }

        .form-label {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .form-control,
        .form-select {
          border: 2px solid #BBDEFB;
          border-radius: 10px;
          padding: 10px 14px;
          transition: all 0.3s ease;
        }

        .form-control:focus,
        .form-select:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.2);
          outline: none;
        }

        .form-select-lg {
          font-size: 1.05rem;
          padding: 12px 16px;
          font-weight: 500;
        }

        .form-control-lg {
          font-size: 1rem;
          padding: 12px 16px;
        }

        /* Selected Item Info */
        .selected-item-info {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 2px solid #90CAF9;
          border-radius: 12px;
          padding: 16px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-label {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .info-value {
          color: #0D47A1;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .info-value.stock {
          color: #1976D2;
          background: #E3F2FD;
          padding: 4px 12px;
          border-radius: 20px;
        }

        .info-value.price {
          color: #1565C0;
          font-size: 1.1rem;
        }

        /* Calculation Preview */
        .calculation-preview {
          background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%);
          border: 2px solid #FFF176;
          border-radius: 12px;
          padding: 16px;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #F57F17;
          font-weight: 600;
        }

        .preview-row.profit {
          padding-top: 8px;
          border-top: 2px solid #FBC02D;
          color: #F57F17;
          font-size: 1.1rem;
          font-weight: 800;
        }

        /* Add to Bill Button */
        .btn-add-item {
          background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.1rem;
          padding: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
        }

        .btn-add-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
          background: linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%);
          color: #ffffff;
        }

        /* Bill Card */
        .bill-card {
          border: none;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
          position: sticky;
          top: 20px;
        }

        .empty-bill {
          padding: 80px 20px;
          text-align: center;
          color: #90CAF9;
        }

        .empty-bill svg {
          color: #BBDEFB;
        }

        /* Bill Items */
        .bill-items {
          max-height: 400px;
          overflow-y: auto;
        }

        .bill-item {
          padding: 16px 20px;
          border-bottom: 2px solid #E3F2FD;
          transition: all 0.2s ease;
        }

        .bill-item:hover {
          background: #F5F5F5;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .item-name {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.05rem;
          margin: 0;
        }

        .btn-remove-item {
          background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
          border: none;
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.3s ease;
        }

        .btn-remove-item:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        }

        .item-details {
          font-size: 0.9rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          color: #424242;
        }

        .detail-row span:first-child {
          color: #757575;
          font-weight: 500;
        }

        .detail-row span:last-child {
          font-weight: 700;
          color: #212121;
        }

        .detail-row.total {
          padding-top: 8px;
          border-top: 1px solid #BBDEFB;
          margin-top: 8px;
          color: #1565C0;
          font-weight: 700;
        }

        .detail-row.profit-row {
          color: #388E3C;
        }

        .profit-positive {
          color: #2E7D32;
          font-weight: 800;
        }

        .profit-negative {
          color: #C62828;
          font-weight: 800;
        }

        /* Bill Summary */
        .bill-summary {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          padding: 20px;
          border-top: 3px solid #2196F3;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 1rem;
          color: #1565C0;
          font-weight: 600;
        }

        .divider {
          height: 2px;
          background: #2196F3;
          margin: 12px 0;
          border-radius: 2px;
        }

        .summary-row.total-row {
          font-size: 1.2rem;
          font-weight: 800;
          color: #0D47A1;
          padding-top: 8px;
        }

        /* Generate Bill Button */
        .card-footer {
          background: #ffffff;
          border-top: 2px solid #BBDEFB;
          padding: 16px 20px;
        }

        .btn-generate-bill {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.15rem;
          padding: 16px;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
        }

        .btn-generate-bill:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(33, 150, 243, 0.5);
          background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
          color: #ffffff;
        }

        .btn-generate-bill:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Scrollbar */
        .bill-items::-webkit-scrollbar {
          width: 8px;
        }

        .bill-items::-webkit-scrollbar-track {
          background: #E3F2FD;
          border-radius: 10px;
        }

        .bill-items::-webkit-scrollbar-thumb {
          background: #2196F3;
          border-radius: 10px;
        }

        .bill-items::-webkit-scrollbar-thumb:hover {
          background: #1976D2;
        }

        /* Responsive */
        @media (max-width: 991px) {
          .sticky-top {
            position: relative !important;
            top: 0 !important;
          }
        }

        @media (max-width: 768px) {
          .nav-title {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default AddOutgoing;