import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

import { AuthProvider } from "./context/AuthContext";
import { AdminRoute, UserRoute } from "./components/ProtectedRoute";

import Welcome from "./components/Welcome";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import UserManagement from "./components/UserManagement";
import AddUser from "./components/AddUser";
import EditUser from "./components/EditUser";
import ItemManagement from "./components/ItemManagement";
import AddItem from "./components/AddItem";
import EditItem from "./components/EditItem";
import Dashboard from "./components/Dashboard";
import IncomeManagement from "./components/IncomeManagement";
import OutgoingManagement from "./components/OutgoingManagement";
import AddIncome from "./components/AddIncome";
import AdminIncomeApproval from "./components/AdminIncomeApproval";
import AddOutgoing from "./components/AddOutgoing";
import DatabaseBackup from "./components/DatabaseBackup";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - No authentication required */}
          <Route path="/" element={<Welcome />} />
          <Route path="/admin" element={<AdminLogin />} />

          {/* Admin Routes - Only accessible by admin users */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/user-management"
            element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/add-user"
            element={
              <AdminRoute>
                <AddUser />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-user/:id"
            element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            }
          />
          <Route
            path="/item-management"
            element={
              <AdminRoute>
                <ItemManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/add-item"
            element={
              <AdminRoute>
                <AddItem />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-item/:id"
            element={
              <AdminRoute>
                <EditItem />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-itam/:id"
            element={
              <AdminRoute>
                <EditItem />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-income-approval"
            element={
              <AdminRoute>
                <AdminIncomeApproval />
              </AdminRoute>
            }
          />
          <Route
            path="/admin-backup"
            element={
              <AdminRoute>
                <DatabaseBackup />
              </AdminRoute>
            }
          />

          {/* User Routes - Accessible by authenticated regular users */}
          <Route
            path="/dashboard"
            element={
              <UserRoute>
                <Dashboard />
              </UserRoute>
            }
          />
          <Route
            path="/itam-management"
            element={
              <UserRoute>
                <ItemManagement />
              </UserRoute>
            }
          />
          <Route
            path="/add-itam"
            element={
              <UserRoute>
                <AddItem />
              </UserRoute>
            }
          />
          <Route
            path="/edit-useritam/:id"
            element={
              <UserRoute>
                <EditItem />
              </UserRoute>
            }
          />
          <Route
            path="/income-management"
            element={
              <UserRoute>
                <IncomeManagement />
              </UserRoute>
            }
          />
          <Route
            path="/add-income"
            element={
              <UserRoute>
                <AddIncome />
              </UserRoute>
            }
          />
          <Route
            path="/outgoing-management"
            element={
              <UserRoute>
                <OutgoingManagement />
              </UserRoute>
            }
          />
          <Route
            path="/add-outgoing"
            element={
              <UserRoute>
                <AddOutgoing />
              </UserRoute>
            }
          />

          {/* Catch-all route - redirect to welcome page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
