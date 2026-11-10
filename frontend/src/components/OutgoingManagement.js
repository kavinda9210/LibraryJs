import React, { useEffect, useState } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiTrendingDown,
  FiPlus,
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiX,
  FiEye,
  FiTrash2,
  FiFileText,
  FiCalendar,
  FiTag,
  FiPackage,
  FiLayers,
  FiDollarSign,
  FiDownload,
  FiTrendingUp,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function OutgoingManagement() {
  const [outgoing, setOutgoing] = useState([]);
  const [filteredOutgoing, setFilteredOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    buyCompany: "",
    billNumber: "",
    itamName: "",
    minQty: "",
    maxQty: "",
    minSellPrice: "",
    maxSellPrice: "",
    minProfit: "",
    maxProfit: "",
  });

  const navigate = useNavigate();

  const fetchOutgoing = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/outgoing");
      setOutgoing(res.data || []);
      setFilteredOutgoing(res.data || []);
      setError("");
    } catch (e) {
      console.error(e);
      setError("Failed to fetch outgoing records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutgoing();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...outgoing];

    if (filters.dateFrom) {
      filtered = filtered.filter((item) => item.date >= filters.dateFrom);
    }
    if (filters.dateTo) {
      filtered = filtered.filter((item) => item.date <= filters.dateTo);
    }
    if (filters.buyCompany) {
      filtered = filtered.filter((item) =>
        item.buy_company.toLowerCase().includes(filters.buyCompany.toLowerCase())
      );
    }
    if (filters.billNumber) {
      filtered = filtered.filter((item) =>
        item.bill_number.toLowerCase().includes(filters.billNumber.toLowerCase())
      );
    }
    if (filters.itamName) {
      filtered = filtered.filter((item) =>
        item.itam_name.toLowerCase().includes(filters.itamName.toLowerCase())
      );
    }
    if (filters.minQty) {
      filtered = filtered.filter((item) => item.qty >= Number(filters.minQty));
    }
    if (filters.maxQty) {
      filtered = filtered.filter((item) => item.qty <= Number(filters.maxQty));
    }
    if (filters.minSellPrice) {
      filtered = filtered.filter((item) => item.sell_price >= Number(filters.minSellPrice));
    }
    if (filters.maxSellPrice) {
      filtered = filtered.filter((item) => item.sell_price <= Number(filters.maxSellPrice));
    }
    if (filters.minProfit) {
      filtered = filtered.filter((item) => item.profit >= Number(filters.minProfit));
    }
    if (filters.maxProfit) {
      filtered = filtered.filter((item) => item.profit <= Number(filters.maxProfit));
    }

    setFilteredOutgoing(filtered);
    setShowFilterPanel(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      buyCompany: "",
      billNumber: "",
      itamName: "",
      minQty: "",
      maxQty: "",
      minSellPrice: "",
      maxSellPrice: "",
      minProfit: "",
      maxProfit: "",
    });
    setFilteredOutgoing(outgoing);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Quick search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setFilteredOutgoing(outgoing);
      return;
    }

    const searched = outgoing.filter(
      (item) =>
        item.buy_company?.toLowerCase().includes(value.toLowerCase()) ||
        item.bill_number?.toLowerCase().includes(value.toLowerCase()) ||
        item.itam_name?.toLowerCase().includes(value.toLowerCase()) ||
        item.record_id?.toString().includes(value)
    );
    setFilteredOutgoing(searched);
  };

  // Generate PDF
  const generatePDF = async () => {
    if (filteredOutgoing.length === 0) {
      alert("No records to generate PDF");
      return;
    }

    try {
      const response = await apiClient.post(
        "/outgoing/generate-pdf",
        { records: filteredOutgoing },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `outgoing_report_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert("PDF generated successfully!");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF report");
    }
  };

  // Download bill by bill number with auth token
  const downloadBill = async (billNumber) => {
    try {
      const res = await apiClient.get(`/outgoing/bill/${encodeURIComponent(billNumber)}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bill_${billNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download bill error:", err);
      alert("Failed to download bill");
    }
  };

  // Show details
  const handleShowDetails = async (recordId) => {
    try {
      const res = await apiClient.get(`/outgoing/${recordId}`);
      setSelected(res.data);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert("Failed to load record details");
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  // Delete
  const handleDelete = async (recordId) => {
    if (!window.confirm("Delete this outgoing record? Stock will be restored.")) return;
    try {
      await apiClient.delete(`/outgoing/${recordId}`);
      fetchOutgoing();
      alert("Record deleted and stock restored successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to delete record");
    }
  };

  const goToDashboard = () => navigate("/dashboard");
  const goToAddOutgoing = () => navigate("/add-outgoing");

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="loading-text mt-3">Loading outgoing records...</p>
      </div>
    );

  if (error)
    return (
      <div className="error-container">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );

  return (
    <div className="outgoing-management">
      {/* Top Navigation */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiTrendingDown size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Outgoing Management</h5>
                  <small className="nav-subtitle">
                    Track and manage outgoing records
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-6 text-md-end mt-3 mt-md-0">
              <button className="btn btn-back me-2" onClick={goToDashboard}>
                <FiArrowLeft size={18} className="me-2" />
                Back to Dashboard
              </button>
              <button className="btn btn-add" onClick={goToAddOutgoing}>
                <FiPlus size={18} className="me-2" />
                Add Outgoing
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        {/* Action Bar */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card action-card shadow-sm">
              <div className="card-body p-3">
                <div className="row align-items-center g-3">
                  {/* Search */}
                  <div className="col-md-4">
                    <div className="input-group">
                      <span className="input-group-text search-icon">
                        <FiSearch size={20} />
                      </span>
                      <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Quick search..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-md-8 text-md-end">
                    <button
                      className="btn btn-filter me-2"
                      onClick={() => setShowFilterPanel(!showFilterPanel)}
                    >
                      <FiFilter size={18} className="me-2" />
                      {showFilterPanel ? "Hide" : "Show"} Filters
                    </button>
                    <button className="btn btn-pdf" onClick={generatePDF}>
                      <FiFileText size={18} className="me-2" />
                      Generate PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilterPanel && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="card filter-card shadow-lg">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="filter-title mb-0">
                      <FiFilter className="me-2" />
                      Advanced Filters
                    </h5>
                    <button
                      className="btn-close-filter"
                      onClick={() => setShowFilterPanel(false)}
                    >
                      <FiX size={20} />
                    </button>
                  </div>

                  <div className="row g-3">
                    {/* Date Range */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiCalendar size={14} className="me-2" />
                        Date From
                      </label>
                      <input
                        className="form-control filter-input"
                        type="date"
                        name="dateFrom"
                        value={filters.dateFrom}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiCalendar size={14} className="me-2" />
                        Date To
                      </label>
                      <input
                        className="form-control filter-input"
                        type="date"
                        name="dateTo"
                        value={filters.dateTo}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Customer */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiTag size={14} className="me-2" />
                        Customer
                      </label>
                      <input
                        className="form-control filter-input"
                        type="text"
                        name="buyCompany"
                        placeholder="Customer name..."
                        value={filters.buyCompany}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Bill Number */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiFileText size={14} className="me-2" />
                        Bill Number
                      </label>
                      <input
                        className="form-control filter-input"
                        type="text"
                        name="billNumber"
                        placeholder="Bill number..."
                        value={filters.billNumber}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Item Name */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiPackage size={14} className="me-2" />
                        Item Name
                      </label>
                      <input
                        className="form-control filter-input"
                        type="text"
                        name="itamName"
                        placeholder="Item name..."
                        value={filters.itamName}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Qty Range */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiLayers size={14} className="me-2" />
                        Min Quantity
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        name="minQty"
                        placeholder="0"
                        value={filters.minQty}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiLayers size={14} className="me-2" />
                        Max Quantity
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        name="maxQty"
                        placeholder="999"
                        value={filters.maxQty}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Price Range */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiDollarSign size={14} className="me-2" />
                        Min Sell Price
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        step="0.01"
                        name="minSellPrice"
                        placeholder="0.00"
                        value={filters.minSellPrice}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiDollarSign size={14} className="me-2" />
                        Max Sell Price
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        step="0.01"
                        name="maxSellPrice"
                        placeholder="9999.99"
                        value={filters.maxSellPrice}
                        onChange={handleFilterChange}
                      />
                    </div>

                    {/* Profit Range */}
                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiTrendingUp size={14} className="me-2" />
                        Min Profit
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        step="0.01"
                        name="minProfit"
                        placeholder="0.00"
                        value={filters.minProfit}
                        onChange={handleFilterChange}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="filter-label">
                        <FiTrendingUp size={14} className="me-2" />
                        Max Profit
                      </label>
                      <input
                        className="form-control filter-input"
                        type="number"
                        step="0.01"
                        name="maxProfit"
                        placeholder="9999.99"
                        value={filters.maxProfit}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>

                  <div className="filter-actions mt-4">
                    <button className="btn btn-apply" onClick={applyFilters}>
                      <FiSearch size={18} className="me-2" />
                      Apply Filters
                    </button>
                    <button className="btn btn-clear me-3" onClick={clearFilters}>
                      <FiX size={18} className="me-2" />
                      Clear All
                    </button>
                    <span className="result-count">
                      Showing {filteredOutgoing.length} of {outgoing.length} records
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="row">
          <div className="col-12">
            <div className="card table-card shadow-lg">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table outgoing-table mb-0">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Bill No</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Balance</th>
                        <th>Sell Price</th>
                        <th>Buy Price</th>
                        <th>Profit</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOutgoing.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="text-center py-5">
                            <div className="no-records">
                              {searchTerm || Object.values(filters).some(v => v) ? (
                                <>
                                  <FiSearch size={48} className="mb-3" />
                                  <p className="mb-0">No records found matching your criteria</p>
                                </>
                              ) : (
                                <>
                                  <FiTrendingDown size={48} className="mb-3" />
                                  <p className="mb-0">No outgoing records found</p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOutgoing.map((row) => (
                          <tr key={row.record_id} className="outgoing-row">
                            <td>
                              <span className="id-badge">{row.record_id}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiCalendar size={14} className="me-2 text-muted" />
                                {row.date}
                              </div>
                            </td>
                            <td className="fw-semibold">{row.buy_company}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiFileText size={14} className="me-2 text-muted" />
                                {row.bill_number}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <FiPackage size={14} className="me-2 text-muted" />
                                {row.itam_name}
                              </div>
                            </td>
                            <td>
                              <span className="qty-badge">{row.qty}</span>
                            </td>
                            <td>
                              <span className="balance-badge">{row.balance}</span>
                            </td>
                            <td>
                              <span className="price-badge">
                                Rs. {parseFloat(row.sell_price).toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <span className="price-badge-buy">
                                Rs. {parseFloat(row.buy_price).toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <span className={row.profit >= 0 ? "profit-positive" : "profit-negative"}>
                                Rs. {parseFloat(row.profit).toFixed(2)}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-action btn-view me-2"
                                onClick={() => handleShowDetails(row.record_id)}
                                title="View Details"
                              >
                                <FiEye size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-download me-2"
                                onClick={() => downloadBill(row.bill_number)}
                                title="Download Bill"
                              >
                                <FiDownload size={16} />
                              </button>
                              <button
                                className="btn btn-action btn-delete"
                                onClick={() => handleDelete(row.record_id)}
                                title="Delete"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer">
                <small className="text-muted">
                  Showing {filteredOutgoing.length} of {outgoing.length} outgoing records
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && selected && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-custom">
              <div className="d-flex align-items-center">
                <div className="modal-icon me-3">
                  <FiTrendingDown size={28} />
                </div>
                <div>
                  <h4 className="modal-title mb-1">Outgoing Record Details</h4>
                  <p className="modal-subtitle mb-0">Record ID: {selected.record_id}</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <FiX size={24} />
              </button>
            </div>

            <div className="modal-body-custom">
              <div className="detail-item">
                <div className="detail-icon">
                  <FiCalendar size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{selected.date}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiTag size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Customer</span>
                  <span className="detail-value">{selected.buy_company}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiFileText size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Bill Number</span>
                  <span className="detail-value">{selected.bill_number}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiPackage size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Item Name</span>
                  <span className="detail-value">{selected.itam_name}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiLayers size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-value">{selected.qty}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiLayers size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Balance</span>
                  <span className="detail-value">{selected.balance}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiDollarSign size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Sell Price</span>
                  <span className="detail-value">Rs. {parseFloat(selected.sell_price).toFixed(2)}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiDollarSign size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Buy Price</span>
                  <span className="detail-value">Rs. {parseFloat(selected.buy_price).toFixed(2)}</span>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon">
                  <FiTrendingUp size={18} />
                </div>
                <div className="detail-content">
                  <span className="detail-label">Profit</span>
                  <span className={`detail-value ${selected.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    Rs. {parseFloat(selected.profit).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button
                className="btn btn-modal-download"
                onClick={() => downloadBill(selected.bill_number)}
              >
                <FiDownload size={18} className="me-2" />
                Download Bill
              </button>
              <button className="btn btn-modal-close" onClick={handleCloseModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .outgoing-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Loading & Error */
        .loading-container,
        .error-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          flex-direction: column;
        }

        .loading-text {
          color: #1565C0;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .spinner-border {
          color: #2196F3 !important;
          width: 3rem;
          height: 3rem;
        }

        /* Top Navigation */
        .top-nav {
          background: linear-gradient(135deg, #FFFFFF 0%, #E3F2FD 100%);
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

        /* Buttons */
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
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
        }

        .btn-add {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
        }

        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(33, 150, 243, 0.3);
          color: #FFFFFF;
        }

        /* Action Card */
        .action-card {
          border: none;
          border-radius: 14px;
          background: #FFFFFF;
        }

        .search-icon {
          background: #E3F2FD;
          border: 2px solid #BBDEFB;
          border-right: none;
          border-radius: 12px 0 0 12px;
          color: #1976D2;
        }

        .search-input {
          border: 2px solid #BBDEFB;
          border-left: none;
          border-radius: 0 12px 12px 0;
          padding: 12px 16px;
          font-size: 1rem;
        }

        .search-input:focus {
          border-color: #2196F3;
          border-left: none;
          box-shadow: none;
          outline: none;
        }

        .btn-filter {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 16px;
          transition: all 0.3s ease;
        }

        .btn-filter:hover {
          background: #2196F3;
          color: #FFFFFF;
        }

        .btn-pdf {
          background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 16px;
          transition: all 0.3s ease;
        }

        .btn-pdf:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
          color: #FFFFFF;
        }

        /* Filter Panel */
        .filter-card {
          border: none;
          border-radius: 18px;
          background: #FFFFFF;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .filter-title {
          color: #1565C0;
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .btn-close-filter {
          background: rgba(33, 150, 243, 0.1);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1976D2;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-close-filter:hover {
          background: #2196F3;
          color: #FFFFFF;
          transform: rotate(90deg);
        }

        .filter-label {
          color: #1565C0;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
        }

        .filter-input {
          border: 2px solid #BBDEFB;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
          background: #F5F5F5;
        }

        .filter-input:focus {
          border-color: #2196F3;
          box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.15);
          outline: none;
          background: #FFFFFF;
        }

        .filter-actions {
          display: flex;
          align-items: center;
          padding-top: 20px;
          border-top: 2px solid #E3F2FD;
          gap: 12px;
        }

        .btn-apply {
          background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-apply:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          color: #FFFFFF;
        }

        .btn-clear {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-clear:hover {
          background: #2196F3;
          color: #FFFFFF;
        }

        .result-count {
          color: #1976D2;
          font-weight: 600;
          font-size: 0.95rem;
        }

        /* Table */
        .table-card {
          border: none;
          border-radius: 18px;
          background: #FFFFFF;
          overflow: hidden;
        }

        .table-card .card-footer {
          background: #E3F2FD;
          border-top: 2px solid #BBDEFB;
          padding: 12px 20px;
        }

        .outgoing-table {
          width: 100%;
        }

        .outgoing-table thead {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
        }

        .outgoing-table thead th {
          color: #FFFFFF !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
          padding: 16px 20px !important;
          border: none !important;
          background: transparent !important;
        }

        .outgoing-table tbody td {
          padding: 16px 20px;
          vertical-align: middle;
          border-bottom: 1px solid #E3F2FD;
          color: #333;
        }

        .outgoing-row {
          transition: all 0.2s ease;
        }

        .outgoing-row:hover {
          background: #F5F5F5;
        }

        /* Badges */
        .id-badge {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          color: #1565C0;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          border: 2px solid #90CAF9;
          display: inline-block;
        }

        .qty-badge {
          background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
          color: #01579B;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #81D4FA;
          display: inline-block;
        }

        .balance-badge {
          background: linear-gradient(135deg, #FFF9C4 0%, #FFF59D 100%);
          color: #F57F17;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #FFF176;
          display: inline-block;
        }

        .price-badge {
          background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%);
          color: #1B5E20;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #81C784;
          display: inline-block;
        }

        .price-badge-buy {
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          color: #0D47A1;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          border: 1px solid #90CAF9;
          display: inline-block;
        }

        .profit-positive {
          background: linear-gradient(135deg, #C8E6C9 0%, #A5D6A7 100%);
          color: #1B5E20;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          border: 1px solid #81C784;
          display: inline-block;
        }

        .profit-negative {
          background: linear-gradient(135deg, #FFCDD2 0%, #EF9A9A 100%);
          color: #B71C1C;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.9rem;
          border: 1px solid #E57373;
          display: inline-block;
        }

        /* Action Buttons */
        .btn-action {
          width: 36px;
          height: 36px;
          padding: 0;
          border-radius: 8px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .btn-view {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: #FFFFFF;
        }

        .btn-view:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
          color: #FFFFFF;
        }

        .btn-download {
          background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
          color: #FFFFFF;
        }

        .btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
          color: #FFFFFF;
        }

        .btn-delete {
          background: linear-gradient(135deg, #F44336 0%, #D32F2F 100%);
          color: #FFFFFF;
        }

        .btn-delete:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
          color: #FFFFFF;
        }

        /* No Records */
        .no-records {
          color: #1976D2;
        }

        .no-records svg {
          color: #90CAF9;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(33, 150, 243, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
          animation: fadeIn 0.3s ease;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          width: 90%;
          max-width: 650px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(33, 150, 243, 0.4);
          animation: slideUp 0.3s ease;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #FFFFFF;
        }

        .modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
        }

        .modal-title {
          color: #FFFFFF;
          font-weight: 700;
          margin: 0;
        }

        .modal-subtitle {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .btn-close-modal {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-close-modal:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .modal-body-custom {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }

        .detail-item {
          display: flex;
          padding: 16px;
          border-bottom: 1px solid #E3F2FD;
          transition: all 0.2s ease;
        }

        .detail-item:hover {
          background: #F5F5F5;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
          border: 2px solid #90CAF9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1976D2;
          margin-right: 16px;
          flex-shrink: 0;
        }

        .detail-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .detail-label {
          font-size: 0.8rem;
          color: #1976D2;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .detail-value {
          color: #333;
          font-size: 1rem;
          font-weight: 500;
        }

        .modal-footer-custom {
          padding: 20px 24px;
          border-top: 2px solid #E3F2FD;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          background: #F5F5F5;
        }

        .btn-modal-download {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
          color: #FFFFFF;
        }

        .btn-modal-close {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 10px 20px;
          transition: all 0.3s ease;
        }

        .btn-modal-close:hover {
          background: #2196F3;
          color: #FFFFFF;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
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

          .outgoing-table thead th {
            font-size: 0.75rem;
            padding: 12px 10px !important;
          }

          .outgoing-table tbody td {
            padding: 12px 10px;
            font-size: 0.9rem;
          }

          .btn-action {
            width: 32px;
            height: 32px;
          }

          .modal-container {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
}

export default OutgoingManagement;