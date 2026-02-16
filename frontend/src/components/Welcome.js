import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";

function Welcome() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = useMemo(() => {
    return username.trim() && password.trim() && !loading;
  }, [username, password, loading]);

  const handleAdminPage = () => navigate("/admin");

  const handleUserLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include", // enable only if using cookies
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || "Login failed");
        return;
      }

      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.adminButton} onClick={handleAdminPage}>
          Admin Login
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>L</div>
          <div>
            <h1 style={styles.title}>Library & Inventory System</h1>
            <p style={styles.subtitle}>Secure access for staff and members</p>
          </div>
        </div>

        <div style={styles.infoBox}>
          Manage books, borrowing, returns, and stock tracking in one platform.
        </div>

        {errorMsg && <div style={styles.error}>{errorMsg}</div>}

        <form onSubmit={handleUserLogin} style={styles.form}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <label style={styles.label}>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              style={styles.input}
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              style={styles.eyeButton}
              onClick={() => setShowPassword((v) => !v)}
              aria-label="Toggle password visibility"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              ...styles.loginButton,
              opacity: canSubmit ? 1 : 0.6,
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>

      <p style={styles.footer}>
        © {new Date().getFullYear()} Library & Inventory Management System
      </p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background:
      "radial-gradient(1000px 500px at 10% 10%, #e7f0ff 0%, transparent 60%), radial-gradient(900px 600px at 90% 30%, #ffe8ec 0%, transparent 55%), #f5f6fa",
    fontFamily:
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    padding: 16,
  },

  topBar: {
    position: "fixed",
    top: 16,
    right: 16,
  },

  card: {
    width: "100%",
    maxWidth: 460,
    background: "#fff",
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb",
  },

  header: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "#0b5fff",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: 800,
    fontSize: 18,
  },

  title: { margin: 0, fontSize: 20 },
  subtitle: { margin: "4px 0 0", color: "#6b7280", fontSize: 13 },

  infoBox: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: 13,
    lineHeight: "18px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
  },

  input: {
    padding: "12px",
    fontSize: 15,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    outline: "none",
    width: "100%",
  },

  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },

  eyeButton: {
    position: "absolute",
    right: 12,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#6b7280",
    padding: 4,
  },

  loginButton: {
    marginTop: 10,
    padding: "12px",
    borderRadius: 12,
    border: "none",
    backgroundColor: "#0b5fff",
    color: "#fff",
    fontWeight: 700,
    fontSize: 15,
  },

  adminButton: {
    padding: "10px 14px",
    borderRadius: 12,
    backgroundColor: "#ff4d4d",
    border: "none",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(255,77,77,0.3)",
  },

  error: {
    marginBottom: 10,
    padding: "10px 12px",
    backgroundColor: "#fff1f2",
    border: "1px solid #fecdd3",
    borderRadius: 12,
    color: "#9f1239",
    fontSize: 14,
  },

  footer: {
    marginTop: 16,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
};

export default Welcome;
