# 📚 Library Income & Outgoing Inventory Management System

**Organization:** Library Service Board - Central Province (Gatambe, Peradeniya)  
**Status:** 🟢 **Production Ready (100% Audited, Secured & Automated)**

A full-stack, enterprise-grade inventory and Point of Sale (POS) system built for libraries and institutions. Features include automated dual-price calculation (selling & cost), multi-item checkout, supplier stock-in approvals, streaming PDF invoices, role-based access control (Admin & Staff), and an **automated SQL backup and recovery system with Windows Task Scheduler and PM2 process management**.

---

## ⚡ Quick Start for Beginners (Set Up in 3 Minutes)

If you have never set up a web server before, follow these simple steps!

### 📋 Prerequisites (Install these first)
1. **Node.js (v18 or higher):** Download and install from [nodejs.org](https://nodejs.org/) (Choose "LTS").
2. **Git:** Download and install from [git-scm.com](https://git-scm.com/).

---

### Step 1: Open Your Terminal or Command Prompt
Open **Command Prompt (cmd)** or **PowerShell** and navigate to your project folder:
```cmd
cd C:\projects\LibraryJs-main
```

---

### Step 2: Configure Environment Files (Copy-Paste)
Run these commands in Windows Command Prompt to create your settings:
```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

---

### Step 3: Install Dependencies
Run in your terminal:
```cmd
cd backend && npm install
cd ..\frontend && npm install
cd ..
```

---

### Step 4: Start the Application

#### Option A: Running with PM2 (Recommended for Production & 24/7 Uptime)
Double-click `scripts\start_pm2.bat` OR run:
```cmd
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```
- **Backend API:** `http://localhost:5000`
- **Frontend App:** `http://localhost:3000`

#### Option B: Running Manually (For Testing / Development)
Open two terminal windows:
- **Terminal 1 (Backend):**
  ```cmd
  cd C:\projects\LibraryJs-main\backend
  npm start
  ```
- **Terminal 2 (Frontend):**
  ```cmd
  cd C:\projects\LibraryJs-main\frontend
  npm start
  ```
Open your browser and navigate to: **`http://localhost:3000`**

---

## 🔐 Default Login Credentials

| Portal | URL | Username | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Control Panel** | `http://localhost:3000/admin` | `lsbcp` | `admin123` | Full System Administrator |
| **Staff POS & Inventory** | `http://localhost:3000/` | `max` | `12345678` | Staff / Cashier |

---

## 🕒 Windows Task Scheduler Setup (Daily Automatic Backups)

The system includes automated, zero-downtime SQLite backups that run safely using SQLite's atomic `VACUUM INTO` engine. You can configure Windows to run backups automatically every day at 02:00 AM even if no browser is open.

### 🚀 1-Click Automated Setup:
1. Open the folder `C:\projects\LibraryJs-main\scripts\`
2. **Right-click `setup_task_scheduler.bat`** and select **"Run as administrator"**.
3. Done! The Windows Scheduled Task `LibraryLMS_Daily_Backup` is created and will automatically backup the database daily at **02:00 AM**.

### 💻 PowerShell Setup (Alternative):
Open PowerShell as Administrator:
```powershell
powershell -ExecutionPolicy Bypass -File C:\projects\LibraryJs-main\scripts\setup_task_scheduler.ps1 -RunTestNow
```

### 📁 Where Are Backups Stored?
All backup files are stored in:
```text
backend\backups\
  ├── backup_auto_YYYY-MM-DD_HH-mm-ss.sqlite      # Scheduled backups
  ├── backup_manual_YYYY-MM-DD_HH-mm-ss.sqlite    # Admin-triggered backups
  ├── backup_upload_YYYY-MM-DD_HH-mm-ss.sqlite    # Uploaded backups
  ├── backup_pre_restore_safety_*.sqlite          # Safety snapshot before restore
  ├── backup_config.json                          # Retention & schedule settings
  └── task_scheduler.log                          # Windows task execution log
```

### 🧪 Run a Manual Backup from Command Line Anytime:
```cmd
node backend\scripts\backup-cli.js --type manual --note "My backup"
```

---

## 🔄 PM2 Production Process Manager (+p2)

PM2 ensures the system runs continuously 24/7, restarts automatically on unexpected errors, and recovers after Windows restarts.

| Command | Action |
| :--- | :--- |
| `scripts\start_pm2.bat` | 1-Click startup for both backend & frontend |
| `pm2 status` | View server status and uptime |
| `pm2 logs` | Live stream server output and errors |
| `pm2 restart all` | Graceful restart of all services |
| `pm2 stop all` | Stop all services |
| `pm2 save` | Save process list for system reboot recovery |

---

## 💾 Database Backup & Restore Web UI

Log in as Admin (`/admin`), go to **Admin Control Panel**, and click **"Backup & Recovery"** (`/admin-backup`):

1. **Create Backup Now:** Instant atomic backup with a single click.
2. **Upload Backup File:**
   - **Save to Library:** Upload an external `.sqlite` or `.db` backup file to store in the backup archive without overwriting live data.
   - **Upload & Restore Immediately:** Validates file schema, takes an automatic safety snapshot of current data, and replaces active data safely.
3. **Download Any Backup:** Download a copy of any historical backup file directly to your computer.
4. **Restore with Zero Data Loss:** Restores the database from any listed backup file. SQLite WAL mode ensures connections automatically reconnect.
5. **Auto-Backup Schedule Settings:** Configure frequency (every 6h, 12h, 24h, 48h, weekly) and retention limits (keeps the last 30 backups, automatically pruning old ones).

---

## 🚀 How to Add & Push to GitHub (For Beginners)

If this project is not yet on GitHub or you want to push your own copy:

### 1. Initialize Git in the Project Root:
```cmd
cd C:\projects\LibraryJs-main
git init
```

### 2. Stage All Files (Cleaned by `.gitignore`):
```cmd
git add .
```

### 3. Make Your Initial Commit:
```cmd
git commit -m "feat: complete library management system with auto-backup, POS auto-calc, and Windows Task Scheduler"
```

### 4. Link to Your GitHub Repository:
1. Go to [github.com](https://github.com/) and click **"New repository"**.
2. Give it a name (e.g. `LibraryJs`) and leave "Initialize with README" unchecked.
3. Copy the repository URL and run:
```cmd
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git branch -M main
git push -u origin main
```

---

## 🧪 Running Automated Tests

Both backend and frontend have comprehensive automated test suites:

### Backend Integration Tests (11/11 Passing)
```cmd
npm test --prefix backend
```
- Health check endpoint
- JWT authentication & bcrypt security
- Role-based authorization & 403 Forbidden checks
- Atomic multi-item POS stock rollbacks
- Dual-price auto-calculation
- Database backup creation, status listing, and deletion

### Frontend Component Tests (4/4 Suites Passing)
```cmd
cd frontend
npm test -- --watchAll=false
```
- Welcome & Login page test
- Admin Login authentication test
- POS billing dual-price auto-calculation test
- Database Backup & Recovery dashboard test

---

## 📂 Architecture & Directory Layout

```text
LibraryJs-main/
├── backend/
│   ├── admin.js                 # Admin authentication endpoints
│   ├── auth.js                  # Staff login & user endpoints
│   ├── backup.js                # Backup API routes (upload, restore, download, delete)
│   ├── backupService.js         # Core SQLite atomic backup & WAL checkpoint logic
│   ├── db.js                    # SQLite connection proxy & auto-migration
│   ├── income.js                # Stock-in routes & PDF report generation
│   ├── itam.js                  # Item catalog CRUD routes (selling & buy prices)
│   ├── outgoing.js              # Multi-item POS sales & streaming PDF invoices
│   ├── server.js                # Express application entrypoint
│   ├── usermanagement.js        # User administration routes
│   ├── LMSDB.sqlite             # Primary SQLite database (WAL mode)
│   ├── backups/                 # Stored database backups & logs
│   ├── middleware/
│   │   └── auth.js              # JWT & role-based route protection
│   ├── scripts/
│   │   └── backup-cli.js        # CLI runner for Task Scheduler
│   ├── test/
│   │   └── api.test.js          # Backend integration tests
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Centralized Axios client with JWT interceptor
│   │   ├── context/AuthContext.js # Auth state provider
│   │   ├── components/
│   │   │   ├── AdminDashboard.js # Administrator control panel (4 tiles)
│   │   │   ├── DatabaseBackup.js # Full backup & restore web interface
│   │   │   ├── AddOutgoing.js   # POS billing with live dual-price calculation
│   │   │   ├── ItemManagement.js# Inventory catalog with buy & sell prices
│   │   │   ├── AddItem.js       # Add inventory item
│   │   │   ├── EditItem.js      # Edit inventory item
│   │   │   ├── IncomeManagement.js # Incoming stock & supplier records
│   │   │   ├── OutgoingManagement.js # Sales records & invoice downloads
│   │   │   └── ProtectedRoute.js# Route protection guards
│   │   ├── App.js               # Route configuration
│   │   └── App.test.js          # Unit tests
│   └── .env.example             # Frontend environment template
├── scripts/
│   ├── backup_job.bat           # Executable script for Windows Task Scheduler
│   ├── setup_task_scheduler.bat # 1-click Windows Task Scheduler installer
│   ├── setup_task_scheduler.ps1 # PowerShell Task Scheduler installer
│   └── start_pm2.bat            # 1-click PM2 process manager launcher
├── ecosystem.config.js          # PM2 configuration for backend & frontend
├── .gitignore                   # Safe Git ignore configuration
└── README.md                    # Beginner-friendly setup and operational guide
```

---

## 🛠️ Troubleshooting & FAQ

#### Q: Port 5000 is already in use?
In `backend\.env`, change `PORT=5000` to `PORT=5001`, and update `REACT_APP_API_URL=http://localhost:5001` in `frontend\.env`.

#### Q: How do I restore the database if my computer crashes?
Go to `backend\backups\`, select your latest `backup_*.sqlite` file, and either:
1. Use the **Upload Backup File** button in the `/admin-backup` web UI.
2. OR simply stop the server, rename the backup file to `LMSDB.sqlite`, replace `backend\LMSDB.sqlite`, and start the server again.

#### Q: Task Scheduler error: "Access is denied"?
Right-click `scripts\setup_task_scheduler.bat` and click **"Run as administrator"**.

---

## 📄 License & Ownership
Developed for the **Library Service Board - Central Province, Gatambe, Peradeniya**.
Internal organizational use. All rights reserved.
