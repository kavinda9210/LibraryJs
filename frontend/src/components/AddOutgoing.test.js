import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import AddOutgoing from "./AddOutgoing";
import apiClient from "../api/client";

jest.mock("../api/client");

describe("AddOutgoing Point of Sale Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders POS bill form without manual cost price input and auto-calculates prices", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: [
        {
          itam_id: 1,
          itam_no: "ITM-01",
          itam_name: "Blue Pen",
          price_per_one: 25.0,
          buy_price: 15.0,
          quantity: 100,
        },
      ],
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <AddOutgoing />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verify header and bill info
    expect(screen.getByText(/Point of Sale - Create Bill/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., BILL-001/i)).toBeInTheDocument();

    // Verify cost price input DOES NOT exist
    expect(screen.queryByPlaceholderText(/Enter cost price/i)).not.toBeInTheDocument();

    // Wait for items to load into dropdown
    await waitFor(() => {
      expect(screen.getByText(/Blue Pen/i)).toBeInTheDocument();
    });

    // Select the item
    const select = screen.getByLabelText(/Select Item/i);
    fireEvent.change(select, { target: { value: "Blue Pen" } });

    // Verify selected item info displays both auto-populated prices
    expect(screen.getAllByText(/Blue Pen/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/100 units/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Unit Selling Price \(Auto\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Unit Cost Price \(Auto\):/i)).toBeInTheDocument();

    // Enter quantity
    const qtyInput = screen.getByPlaceholderText(/Enter quantity/i);
    fireEvent.change(qtyInput, { target: { value: "3" } });

    // Verify auto-calculated preview
    expect(screen.getByText(/Auto-Calculated Selling Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 75\.00/i)).toBeInTheDocument(); // 25 * 3
    expect(screen.getByText(/Auto-Calculated Cost Total:/i)).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 45\.00/i)).toBeInTheDocument(); // 15 * 3
    expect(screen.getByText(/Rs\. 30\.00/i)).toBeInTheDocument(); // Profit: 75 - 45
  });
});
