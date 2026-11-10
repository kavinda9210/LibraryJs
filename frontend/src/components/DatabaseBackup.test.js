import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import DatabaseBackup from "./DatabaseBackup";
import apiClient from "../api/client";

jest.mock("../api/client");

describe("DatabaseBackup Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders backup dashboard with metrics, controls, and backup list", async () => {
    apiClient.get.mockResolvedValueOnce({
      data: {
        backups: [
          {
            filename: "backup_auto_2026-11-10_02-00-00.sqlite",
            type: "auto",
            size: 36864,
            sizeFormatted: "36.00 KB",
            createdAt: "2026-11-10T02:00:00.000Z",
          },
        ],
        status: {
          activeDatabase: {
            sizeFormatted: "36.00 KB",
          },
          config: {
            auto_backup_enabled: true,
            interval_hours: 24,
            max_retention_copies: 30,
          },
          backupsCount: 1,
          totalStorageUsed: "36.00 KB",
        },
      },
    });

    render(
      <AuthProvider>
        <BrowserRouter>
          <DatabaseBackup />
        </BrowserRouter>
      </AuthProvider>
    );

    // Verify header title
    expect(
      screen.getByText(/Database Backup & Recovery/i)
    ).toBeInTheDocument();

    // Verify main action buttons
    expect(screen.getByText(/Create Backup Now/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Backup File/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Scheduler & PM2/i)).toBeInTheDocument();

    // Wait for data load
    await waitFor(() => {
      expect(
        screen.getByText("backup_auto_2026-11-10_02-00-00.sqlite")
      ).toBeInTheDocument();
      expect(screen.getByText(/Scheduled Auto/i)).toBeInTheDocument();
    });
  });
});
