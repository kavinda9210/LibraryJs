import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

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
import ItamManagement from "./components/ItamManagement";
import IncomeManagement from "./components/IncomeManagement";
import OutgoingManagement from "./components/OutgoingManagement";
import AddIncome from "./components/AddIncome";
import AdminIncomeApproval from "./components/AdminIncomeApproval";
import AddOutgoing from "./components/AddOutgoing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/edit-user/:id" element={<EditUser />} />
        <Route path="/item-management" element={<ItemManagement />} />
        <Route path="/add-item" element={<AddItem />} />
        <Route path="/edit-itam/:id" element={<EditItem />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/itam-management" element={<ItamManagement />} />
        <Route path="/income-management" element={<IncomeManagement />} />
        <Route path="/outgoing-management" element={<OutgoingManagement />} />
        <Route path="/add-income" element={<AddIncome />} />
        <Route path="/admin-income-approval" element={<AdminIncomeApproval />} />
        <Route path="/add-outgoing" element={<AddOutgoing />} />

      </Routes>
    </Router>
  );
}

export default App;
