import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders Welcome and Login page by default", () => {
  render(<App />);

  // Check main heading
  const welcomeHeading = screen.getByText(/Welcome to Inventory Management System/i);
  expect(welcomeHeading).toBeInTheDocument();

  // Check organization text (found in header and footer)
  const orgElements = screen.getAllByText(/Library Service Board - Central Province/i);
  expect(orgElements.length).toBeGreaterThanOrEqual(1);

  // Check Admin Login button
  const adminButtons = screen.getAllByText(/Admin Login/i);
  expect(adminButtons.length).toBeGreaterThanOrEqual(1);

  // Check Username input field
  const usernameInput = screen.getByPlaceholderText(/Enter username/i);
  expect(usernameInput).toBeInTheDocument();

  // Check Password input field
  const passwordInput = screen.getByPlaceholderText(/Enter password/i);
  expect(passwordInput).toBeInTheDocument();
});
