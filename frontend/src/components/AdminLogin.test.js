import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import AdminLogin from "./AdminLogin";

test("renders Administrator Access login form", () => {
  render(
    <AuthProvider>
      <BrowserRouter>
        <AdminLogin />
      </BrowserRouter>
    </AuthProvider>
  );

  expect(screen.getByText(/Administrator Access/i)).toBeInTheDocument();
  expect(screen.getByText(/Authorized Personnel Only/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter admin username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter admin password/i)).toBeInTheDocument();
  expect(screen.getByText(/Access Admin Panel/i)).toBeInTheDocument();
});
