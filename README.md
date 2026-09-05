# Click.camp Workspace

<p align="center">
  <img src="public/logo.svg" alt="Click.camp Logo" width="300" />
</p>

A multi-role enterprise workspace and attendance management platform built with React, TypeScript, Tailwind CSS, Express, and Firebase Firestore with real-time bidirectional synchronization.

---

## 🌟 Overview

Click.camp Workspace provides an integrated portal for company personnel across administrative, human resource, and staff roles:

- **Admin Portal**: Complete organizational control, credential management, role provisioning (Admin / HR / Employee), onboarding approval workflows, and master audit feeds.
- **HR Dashboard**: Organization-wide attendance monitoring, leave request approvals, real-time staff status tracking, shift summaries, and CSV payroll & attendance reporting.
- **Employee Workspace**: Interactive IST clock-in / clock-out time tracking, automated shift duration calculation, leave request filing, and personal attendance history.
- **DMS (Document Management System)**: Secure document tracking, upload logging, category filtering, and tamper-resistant audit logs.
- **Integrated Mini-Apps**: Built-in Webmail, Team Chat, System Settings, and Notification Center.

---

## 🚀 Key Features

### 1. Real-Time Cloud Synchronization
- Powered by Firebase Firestore real-time listeners (`onSnapshot`).
- Instant status reflection across all connected clients without manual page reloads.

### 2. Time & Attendance in Indian Standard Time (IST)
- Authoritative IST timestamping for shift starts, pauses, and completions.
- Daily and weekly working hours aggregation with overtime calculations.

### 3. Leave Management System
- Submit vacation, sick, or personal time-off requests.
- Multi-tier review and approval lifecycle managed directly by HR and Admins.

### 4. Advanced Reporting & CSV Exports
- Export comprehensive attendance logs filtered by department, status, or date range.
- Pre-formatted for payroll accounting and compliance auditing.

### 5. Document Management (DMS)
- Upload, classify, and audit corporate policies, contracts, and timesheets.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Backend Server**: Node.js, Express (API routes + Vite development middleware)
- **Database & Auth**: Firebase Firestore real-time database
- **Build Tool**: Vite, Bun / npm, esbuild

---

## 📁 Project Structure

```text
├── public/
│   └── logo.svg                 # Scalable vector brand logo
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx   # Admin directory, onboarding, security
│   │   ├── HRDashboard.tsx      # HR attendance, shifts, leave approvals
│   │   ├── EmployeeDashboard.tsx# Clock-in/out, personal logs, leave filing
│   │   ├── AttendanceExportModal.tsx # CSV payroll & report exporter
│   │   ├── DMSModule.tsx        # Document management & audit logs
│   │   ├── LoginPortal.tsx      # Multi-user authentication & demo accounts
│   │   ├── HomeScreen.tsx       # Unified desktop-style app launcher
│   │   ├── ChatApp.tsx          # Real-time team messaging
│   │   ├── WebmailApp.tsx       # Corporate webmail client
│   │   ├── SettingsApp.tsx      # Profile, security, and preferences
│   │   └── NotificationCenter.tsx # System alerts & activity stream
│   ├── lib/
│   │   └── firebase.ts          # Firebase configuration & Firestore initialization
│   ├── App.tsx                  # Root layout & role router
│   ├── types.ts                 # TypeScript types & data schemas
│   └── utils.ts                 # IST formatting & helper functions
├── firebase-blueprint.json      # Firestore collection schemas & validation
├── firestore.rules              # Security & access control rules
├── server.ts                    # Express server with static asset routing
└── package.json                 # Project dependencies & scripts
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/clickcamp-workspace.git
   cd clickcamp-workspace
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and provide any necessary credentials:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

6. Start production server:
   ```bash
   npm start
   ```

---

## 🔒 Security & Roles

| Role | Access Level |
|---|---|
| **Admin** | Full system access, add/edit personnel, approve accounts, view all logs |
| **HR** | View staff logs, approve/reject leaves, export payroll reports, manage DMS |
| **Employee** | Clock in/out, view personal attendance history, request leaves |

---

## 📄 License

This project is licensed under the MIT License.
