import React, { useState, useEffect, useRef } from "react";
import apiClient from "../api/client";
import { useNavigate } from "react-router-dom";
import {
  FiDatabase,
  FiArrowLeft,
  FiDownload,
  FiUploadCloud,
  FiRotateCcw,
  FiTrash2,
  FiPlus,
  FiSettings,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiHardDrive,
  FiFileText,
  FiSearch,
  FiTerminal,
} from "react-icons/fi";
import "bootstrap/dist/css/bootstrap.min.css";

function DatabaseBackup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [backups, setBackups] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);

  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);

  // Settings form
  const [configForm, setConfigForm] = useState({
    auto_backup_enabled: true,
    interval_hours: 24,
    max_retention_copies: 30,
  });

  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("library"); // "library" or "restore"

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/backup");
      setBackups(res.data.backups || []);
      setStatus(res.data.status || null);
      if (res.data.status?.config) {
        setConfigForm({
          auto_backup_enabled: res.data.status.config.auto_backup_enabled,
          interval_hours: res.data.status.config.interval_hours || 24,
          max_retention_copies: res.data.status.config.max_retention_copies || 30,
        });
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load backup data:", err);
      setError(err?.response?.data?.error || "Failed to load backup details");
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Manual Backup
  const handleCreateManualBackup = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await apiClient.post("/api/backup/create", {
        note: "Manual backup triggered from admin panel",
      });
      setSuccess(`✅ Backup created successfully: ${res.data.backup?.filename}`);
      await fetchBackupData();
    } catch (err) {
      console.error("Create backup failed:", err);
      setError(err?.response?.data?.error || "Failed to create database backup");
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Download Backup File
  const handleDownloadBackup = async (filename) => {
    try {
      const res = await apiClient.get(`/api/backup/download/${encodeURIComponent(filename)}`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess(`Downloaded ${filename}`);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download backup file");
    }
  };

  // 3. Confirm and execute Restore
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await apiClient.post(
        `/api/backup/restore/${encodeURIComponent(selectedBackupForRestore.filename)}`
      );
      setSuccess(
        `✅ Database successfully restored from ${selectedBackupForRestore.filename}! An automatic safety snapshot was created: ${res.data.result?.safetyBackup}`
      );
      setShowRestoreModal(false);
      setSelectedBackupForRestore(null);
      await fetchBackupData();
    } catch (err) {
      console.error("Restore failed:", err);
      setError(err?.response?.data?.error || "Database restore failed");
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete Backup
  const handleDeleteBackup = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete backup file "${filename}"?`)) {
      return;
    }
    try {
      setActionLoading(true);
      setError(null);
      await apiClient.delete(`/api/backup/${encodeURIComponent(filename)}`);
      setSuccess(`Backup file "${filename}" was deleted`);
      await fetchBackupData();
    } catch (err) {
      console.error("Delete failed:", err);
      setError(err?.response?.data?.error || "Failed to delete backup file");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Submit Uploaded File
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a valid .sqlite, .db, or .sql backup file");
      return;
    }

    const formData = new FormData();
    formData.append("backupFile", uploadFile);

    try {
      setActionLoading(true);
      setError(null);

      if (uploadMode === "restore") {
        if (
          !window.confirm(
            "⚠️ WARNING: You are about to upload AND RESTORE this database backup immediately. An automatic safety snapshot of current data will be saved. Proceed?"
          )
        ) {
          setActionLoading(false);
          return;
        }

        const res = await apiClient.post("/api/backup/upload-and-restore", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(
          `✅ Upload and Restore successful! Active database is now restored. Safety backup saved: ${res.data.result?.safetyBackup}`
        );
      } else {
        const res = await apiClient.post("/api/backup/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess(`✅ Backup file uploaded and verified successfully: ${res.data.filename}`);
      }

      setShowUploadModal(false);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchBackupData();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err?.response?.data?.error || "Failed to process uploaded backup file");
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Save Configuration Settings
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setError(null);
      await apiClient.post("/api/backup/config", configForm);
      setSuccess("✅ Automatic backup settings updated successfully");
      setShowConfigModal(false);
      await fetchBackupData();
    } catch (err) {
      console.error("Failed to update config:", err);
      setError(err?.response?.data?.error || "Failed to save backup settings");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBackups = backups.filter((b) =>
    b.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeBadge = (type) => {
    switch (type) {
      case "auto":
        return <span className="badge bg-primary">Scheduled Auto</span>;
      case "manual":
        return <span className="badge bg-success">Manual Snapshot</span>;
      case "upload":
        return <span className="badge bg-info text-dark">Uploaded File</span>;
      case "safety":
        return <span className="badge bg-warning text-dark">Pre-Restore Safety</span>;
      default:
        return <span className="badge bg-secondary">{type}</span>;
    }
  };

  return (
    <div className="database-backup-page">
      {/* Top Navigation */}
      <nav className="top-nav shadow-sm">
        <div className="container-fluid px-4">
          <div className="row align-items-center py-3">
            <div className="col-md-7">
              <div className="d-flex align-items-center">
                <div className="page-icon me-3">
                  <FiDatabase size={24} />
                </div>
                <div>
                  <h5 className="mb-0 nav-title">Database Backup & Recovery</h5>
                  <small className="nav-subtitle">
                    Automatic & manual SQL backups, restore system, and file upload
                  </small>
                </div>
              </div>
            </div>
            <div className="col-md-5 text-md-end mt-3 mt-md-0">
              <button
                className="btn btn-back"
                onClick={() => navigate("/admin-dashboard")}
              >
                <FiArrowLeft size={18} className="me-2" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container-fluid py-4 px-4">
        {/* Alerts */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
            <FiAlertTriangle size={18} className="me-2" />
            <strong>Error:</strong> {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
            <FiCheckCircle size={18} className="me-2" />
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess(null)}
            ></button>
          </div>
        )}

        {/* Status Metrics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-md-6">
            <div className="card metric-card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="metric-label">Active Database</span>
                  <div className="metric-icon icon-blue">
                    <FiHardDrive size={20} />
                  </div>
                </div>
                <h4 className="metric-value mb-1">
                  {status?.activeDatabase?.sizeFormatted || "Calculating..."}
                </h4>
                <small className="text-muted">
                  SQLite 3 Database (WAL Mode Active)
                </small>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card metric-card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="metric-label">Auto-Backup System</span>
                  <div className="metric-icon icon-green">
                    <FiClock size={20} />
                  </div>
                </div>
                <h4 className="metric-value mb-1">
                  {status?.config?.auto_backup_enabled ? (
                    <span className="text-success">Active</span>
                  ) : (
                    <span className="text-secondary">Disabled</span>
                  )}
                </h4>
                <small className="text-muted">
                  Every {status?.config?.interval_hours || 24} hrs (Max {status?.config?.max_retention_copies || 30} copies)
                </small>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card metric-card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="metric-label">Stored Backups</span>
                  <div className="metric-icon icon-purple">
                    <FiDatabase size={20} />
                  </div>
                </div>
                <h4 className="metric-value mb-1">
                  {status?.backupsCount ?? backups.length} Files
                </h4>
                <small className="text-muted">
                  Total Size: {status?.totalStorageUsed || "0 Bytes"}
                </small>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card metric-card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="metric-label">Windows Scheduler & PM2</span>
                  <div className="metric-icon icon-orange">
                    <FiTerminal size={20} />
                  </div>
                </div>
                <h4 className="metric-value mb-1">Ready</h4>
                <small className="text-muted">
                  Daily task & PM2 process manager
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="card control-card shadow-sm mb-4">
          <div className="card-body p-3">
            <div className="row g-2 align-items-center">
              <div className="col-lg-6 col-md-12">
                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary-custom"
                    onClick={handleCreateManualBackup}
                    disabled={actionLoading}
                  >
                    <FiPlus size={18} className="me-2" />
                    Create Backup Now
                  </button>

                  <button
                    className="btn btn-outline-primary-custom"
                    onClick={() => setShowUploadModal(true)}
                    disabled={actionLoading}
                  >
                    <FiUploadCloud size={18} className="me-2" />
                    Upload Backup File
                  </button>

                  <button
                    className="btn btn-outline-secondary-custom"
                    onClick={() => setShowConfigModal(true)}
                    disabled={actionLoading}
                  >
                    <FiSettings size={18} className="me-2" />
                    Schedule Settings
                  </button>

                  <button
                    className="btn btn-outline-dark-custom"
                    onClick={() => setShowSchedulerModal(true)}
                  >
                    <FiTerminal size={18} className="me-2" />
                    Task Scheduler & PM2
                  </button>
                </div>
              </div>

              <div className="col-lg-6 col-md-12">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <FiSearch size={16} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search backups by filename..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backups List Table */}
        <div className="card table-card shadow-lg">
          <div className="card-header d-flex justify-content-between align-items-center py-3">
            <div className="d-flex align-items-center">
              <FiFileText size={20} className="me-2" />
              <strong>Backup Archive ({filteredBackups.length} Files)</strong>
            </div>
            <button
              className="btn btn-sm btn-light"
              onClick={fetchBackupData}
              disabled={loading}
            >
              Refresh List
            </button>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3 text-muted">Loading backup archive...</p>
              </div>
            ) : filteredBackups.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <FiDatabase size={48} className="mb-3 text-secondary" />
                <h5>No backup files found</h5>
                <p className="mb-3">
                  Click <strong>Create Backup Now</strong> or{" "}
                  <strong>Upload Backup File</strong> to get started.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "35%" }}>Backup File</th>
                      <th style={{ width: "15%" }}>Type</th>
                      <th style={{ width: "20%" }}>Created Date</th>
                      <th style={{ width: "10%" }}>File Size</th>
                      <th style={{ width: "20%" }} className="text-end pe-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBackups.map((b) => (
                      <tr key={b.filename}>
                        <td>
                          <div className="d-flex align-items-center">
                            <FiDatabase size={18} className="me-2 text-primary" />
                            <span className="fw-semibold text-break">
                              {b.filename}
                            </span>
                          </div>
                        </td>
                        <td>{getTypeBadge(b.type)}</td>
                        <td>
                          {new Date(b.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {b.sizeFormatted}
                          </span>
                        </td>
                        <td className="text-end pe-4">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleDownloadBackup(b.filename)}
                            title="Download backup file"
                          >
                            <FiDownload size={14} className="me-1" />
                            Download
                          </button>

                          <button
                            className="btn btn-sm btn-outline-warning text-dark me-2"
                            onClick={() => {
                              setSelectedBackupForRestore(b);
                              setShowRestoreModal(true);
                            }}
                            title="Restore active database from this backup"
                          >
                            <FiRotateCcw size={14} className="me-1" />
                            Restore
                          </button>

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteBackup(b.filename)}
                            title="Delete this backup"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Upload Backup Modal */}
      {showUploadModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FiUploadCloud size={20} className="me-2" />
                  Upload Database Backup File
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUploadSubmit}>
                <div className="modal-body p-4">
                  <p className="text-muted">
                    Select a previously exported <code>.sqlite</code>,{" "}
                    <code>.db</code>, or <code>.sql</code> file from your computer.
                  </p>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Backup File</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      accept=".sqlite,.db,.sql"
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      required
                    />
                    <small className="text-muted">
                      Accepted formats: .sqlite, .db, .sql (Maximum 100 MB)
                    </small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Action Option</label>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="uploadAction"
                        id="optLibrary"
                        checked={uploadMode === "library"}
                        onChange={() => setUploadMode("library")}
                      />
                      <label className="form-check-label" htmlFor="optLibrary">
                        <strong>Save to Backup Library:</strong> Upload, verify
                        schema, and store in backup list. Does not overwrite active
                        data.
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="uploadAction"
                        id="optRestore"
                        checked={uploadMode === "restore"}
                        onChange={() => setUploadMode("restore")}
                      />
                      <label className="form-check-label" htmlFor="optRestore">
                        <strong className="text-danger">
                          Upload & Restore Immediately:
                        </strong>{" "}
                        Validates the file, creates a safety backup of your
                        current database, and replaces active data immediately.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn ${
                      uploadMode === "restore" ? "btn-danger" : "btn-primary"
                    }`}
                    disabled={actionLoading || !uploadFile}
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Processing...
                      </>
                    ) : uploadMode === "restore" ? (
                      "Upload & Restore Now"
                    ) : (
                      "Upload to Archive"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Restore Confirmation Modal */}
      {showRestoreModal && selectedBackupForRestore && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom">
            <div className="modal-content shadow-lg border-danger">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <FiAlertTriangle size={20} className="me-2" />
                  Confirm Database Restore
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRestoreModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p>
                  You are about to restore the system database from the following
                  backup file:
                </p>
                <div className="alert alert-light border">
                  <strong>File:</strong> {selectedBackupForRestore.filename}
                  <br />
                  <strong>Date:</strong>{" "}
                  {new Date(selectedBackupForRestore.createdAt).toLocaleString()}
                  <br />
                  <strong>Size:</strong> {selectedBackupForRestore.sizeFormatted}
                </div>

                <div className="alert alert-warning mb-0">
                  <FiCheckCircle size={16} className="me-2 text-success" />
                  <strong>Zero-Data-Loss Guarantee:</strong> An automatic
                  safety snapshot of your current database will be saved before the
                  restore starts. You can revert back anytime if needed.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRestoreModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmRestore}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Restoring Database...
                    </>
                  ) : (
                    "Yes, Restore Database"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Settings Modal */}
      {showConfigModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FiSettings size={20} className="me-2" />
                  Automatic Backup Settings
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowConfigModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveConfig}>
                <div className="modal-body p-4">
                  <div className="form-check form-switch mb-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="autoBackupToggle"
                      checked={configForm.auto_backup_enabled}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          auto_backup_enabled: e.target.checked,
                        })
                      }
                    />
                    <label
                      className="form-check-label fw-bold"
                      htmlFor="autoBackupToggle"
                    >
                      Enable Background Automatic Backups
                    </label>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Backup Interval (Hours)
                    </label>
                    <select
                      className="form-select"
                      value={configForm.interval_hours}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          interval_hours: Number(e.target.value),
                        })
                      }
                    >
                      <option value="6">Every 6 Hours</option>
                      <option value="12">Every 12 Hours</option>
                      <option value="24">Every 24 Hours (Daily)</option>
                      <option value="48">Every 48 Hours (Every 2 days)</option>
                      <option value="168">Every 168 Hours (Weekly)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Maximum Retention Copies
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="5"
                      max="200"
                      value={configForm.max_retention_copies}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          max_retention_copies: Number(e.target.value),
                        })
                      }
                    />
                    <small className="text-muted">
                      Older automatic backups beyond this limit will be safely
                      pruned.
                    </small>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowConfigModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. Windows Task Scheduler & PM2 Modal */}
      {showSchedulerModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-custom modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <FiTerminal size={20} className="me-2" />
                  Windows Task Scheduler & PM2 Setup Guide
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowSchedulerModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <h6 className="fw-bold text-primary">
                  1. Automatic Windows Task Scheduler (1-Click)
                </h6>
                <p className="text-muted small">
                  You can schedule an OS-level automatic daily backup in Windows
                  Task Scheduler so backups run even if nobody is logged in to the
                  web app:
                </p>
                <div className="bg-light p-3 rounded border font-monospace small mb-3">
                  <strong>Option A (Command Prompt / Administrator):</strong>
                  <br />
                  <code>
                    cd C:\projects\LibraryJs-main\scripts &amp;&amp;
                    setup_task_scheduler.bat
                  </code>
                  <br />
                  <br />
                  <strong>Option B (PowerShell Administrator):</strong>
                  <br />
                  <code>
                    powershell -ExecutionPolicy Bypass -File
                    C:\projects\LibraryJs-main\scripts\setup_task_scheduler.ps1
                  </code>
                </div>

                <h6 className="fw-bold text-primary">
                  2. PM2 Production Process Manager (+p2)
                </h6>
                <p className="text-muted small">
                  Keep both backend and frontend running 24/7 with automatic
                  restart on crash or Windows reboot:
                </p>
                <div className="bg-light p-3 rounded border font-monospace small mb-3">
                  <strong>Start with 1-click script:</strong>
                  <br />
                  <code>
                    cd C:\projects\LibraryJs-main\scripts &amp;&amp; start_pm2.bat
                  </code>
                  <br />
                  <br />
                  <strong>Or run PM2 directly:</strong>
                  <br />
                  <code>
                    npm install -g pm2<br />
                    pm2 start ecosystem.config.js<br />
                    pm2 save
                  </code>
                </div>

                <h6 className="fw-bold text-primary">3. Standalone CLI Backup Command</h6>
                <div className="bg-light p-3 rounded border font-monospace small">
                  <code>
                    node C:\projects\LibraryJs-main\backend\scripts\backup-cli.js
                    --type manual --note "CLI snapshot"
                  </code>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSchedulerModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS */}
      <style>{`
        .database-backup-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

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
          color: white;
        }

        .nav-title {
          color: #1565C0;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .nav-subtitle {
          color: #1976D2;
          font-size: 0.85rem;
        }

        .btn-back {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196F3;
          border-radius: 10px;
          color: #1976D2;
          font-weight: 600;
          padding: 8px 18px;
          transition: all 0.3s ease;
        }

        .btn-back:hover {
          background: #2196F3;
          color: white;
        }

        /* Metric cards */
        .metric-card {
          border: none;
          border-radius: 14px;
          transition: transform 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
        }

        .metric-label {
          color: #555;
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
        }

        .metric-value {
          font-weight: 700;
          color: #1565C0;
        }

        .metric-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-blue { background: #e3f2fd; color: #1976D2; }
        .icon-green { background: #e8f5e9; color: #388e3c; }
        .icon-purple { background: #f3e5f5; color: #7b1fa2; }
        .icon-orange { background: #fff3e0; color: #f57c00; }

        /* Controls */
        .control-card {
          border: none;
          border-radius: 14px;
        }

        .btn-primary-custom {
          background: #2196F3;
          color: white;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          padding: 8px 16px;
        }

        .btn-primary-custom:hover {
          background: #1976D2;
          color: white;
        }

        .btn-outline-primary-custom {
          background: transparent;
          color: #1976D2;
          border: 1.5px solid #2196F3;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 16px;
        }

        .btn-outline-primary-custom:hover {
          background: #2196F3;
          color: white;
        }

        .btn-outline-secondary-custom {
          background: transparent;
          color: #555;
          border: 1.5px solid #aaa;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 16px;
        }

        .btn-outline-dark-custom {
          background: transparent;
          color: #212529;
          border: 1.5px solid #212529;
          font-weight: 600;
          border-radius: 8px;
          padding: 8px 16px;
        }

        .table-card {
          border: none;
          border-radius: 14px;
          overflow: hidden;
        }

        .table-card .card-header {
          background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
          color: white;
          border: none;
        }

        /* Modal styling */
        .modal-backdrop-custom {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }

        .modal-dialog-custom {
          width: 100%;
          max-width: 580px;
          margin: 20px;
        }

        .modal-dialog-custom.modal-lg {
          max-width: 720px;
        }

        .modal-content {
          border-radius: 14px;
          border: none;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default DatabaseBackup;
