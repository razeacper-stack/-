# School Management System (SMS) — نظام إدارة المدارس

A production-grade, multi-branch School Management System built with React 18, TypeScript, Tailwind CSS, Vite, and designed for desktop packaging via Tauri on Windows. Full first-class bilingual support (Arabic RTL and English LTR) with complete operational, academic, attendance, scheduling, financial, audit, search, reporting, and AI assistance modules.

---

## 1. Project Overview & Architecture

### Technology Stack
- **Frontend Framework**: React 18 / TypeScript
- **Styling & Design System**: Tailwind CSS with RTL / LTR layout mirroring and Light / Dark / System themes
- **Desktop Runtime**: Tauri v2 (`src-tauri/`) with native Windows webview packaging
- **State & Data Layer**: Domain-driven in-memory storage services with LocalStorage persistence and integer minor-unit arithmetic
- **Security & Authorization**: Centralized role-based access control (`authStorage`), cryptographic WebCrypto password hashing (Salted SHA-256), and strict multi-branch boundary enforcement
- **AI Engine**: Deterministic offline `BuiltinAIProvider` with prompt-injection defense, tool allowlists, and 2-step administrative confirmation

---

## 2. Requirements & Development Setup

### System Prerequisites
- **Node.js**: v18.0.0 or higher (v22 LTS recommended)
- **npm**: v9.0.0 or higher
- **Rust Toolchain** *(for Tauri desktop builds)*: `rustc`, `cargo` (Rust 1.77+), and MSVC C++ Build Tools on Windows

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd school-management-system

# Install dependencies
npm install
```

### Running in Development
```bash
# Web development mode (Port 3000)
npm run dev

# Tauri desktop development mode (requires local Rust toolchain)
npm run tauri dev
```

---

## 3. Test & Verification Pipeline

The application includes over 490 automated verification tests spanning all approved phases:

```bash
# Run the complete test suite (Phases 6 through 15)
npm test

# Run individual phase suites
npm run test:phase6   # Teachers & Faculty
npm run test:phase7   # Timetable & Scheduling
npm run test:phase8   # Attendance & Session Lifecycle
npm run test:phase9   # Fees & Financial Management
npm run test:phase10  # Dashboard & Overview Aggregations
npm run test:phase11  # Global Search, Reports & Export
npm run test:phase12  # AI Smart Assistant & Security
npm run test:phase13  # Notifications, Audit Ledger & Activity
npm run test:phase14  # Security Hardening & Performance Bounded SLAs
npm run test:phase15  # Production & Release Verification

# Type checking & static verification
npm run lint          # Runs: tsc --noEmit

# Dependency security audit
npm audit
```

---

## 4. Production Build & Packaging

### Web Production Build
```bash
npm run build
```
Generates optimized, minified production assets in `dist/`.

### Windows Tauri Desktop Installer Build
```bash
# On a Windows host with Rust and WiX/NSIS toolchain installed:
npm run tauri build
```
Generates Windows installer packages:
- `src-tauri/target/release/bundle/nsis/SchoolManagementSystem_1.0.0_x64-setup.exe`
- `src-tauri/target/release/bundle/msi/SchoolManagementSystem_1.0.0_x64_en-US.msi`

---

## 5. Security & Access Control Model

### Centralized Authorization
All authorization logic routes strictly through `authStorage`:
- `authStorage.hasPermission(actingUser, permission)`
- `authStorage.isSuperAdmin(actingUser)`
Direct authorization checks via `permissions.includes(...)` or unsanctioned `role === 'SUPER_ADMIN'` comparisons are strictly disallowed.

### Role Hierarchy & Permissions Matrix
1. **Super Administrator (`SUPER_ADMIN`)**: Unhindered global access across all campus branches. Can inspect, manage, and configure all school records.
2. **Campus Manager (`MANAGER`)**: Full branch-scoped operational and financial administrative authority.
3. **Teacher (`TEACHER`)**: Assigned classroom rosters, weekly timetables, student roll-call entry, and instructional views. Strictly blocked from financial ledgers, salary data, and foreign campus records.
4. **Staff Clerk (`STAFF`)**: Front-desk operations, student directory viewing, and basic attendance checks.
5. **Viewer (`VIEWER`)**: Read-only oversight. Blocked from mutations, financial records, and CSV exports.

### Multi-Branch Tenant Scoping
Each entity belongs to a single campus branch (`branchId`). Cross-branch queries and mutations (e.g., editing Jeddah records from a Riyadh context or creating invoices referencing foreign campus students) are rejected at the service storage layer with security exceptions.

### Financial Precision
- Stored exclusively in integer minor units (Halalas / cents).
- Zero floating-point representation in persistence layers.
- Strict refund caps prevent refunds from exceeding net paid amounts.

### Content Security Policy (CSP)
Enforced in `index.html` and `src-tauri/tauri.conf.json`:
```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; connect-src 'self' https://generativelanguage.googleapis.com; frame-src 'none'; object-src 'none'; base-uri 'self';
```

---

## 6. AI Assistant Model & Guardrails

- **Default Engine**: Deterministic `BuiltinAIProvider` executing verified in-memory tool routines with zero external network transmission.
- **Prompt Injection Defense**: Intercepts system prompt extractions and instruction overrides in both English and Arabic.
- **Action Confirmation**: State mutations proposed by the AI require 2-step human confirmation before execution.
- **Data Minimization**: Aggregate counts and summarized KPIs are returned rather than dumping raw databases into prompt context windows.

---

## 7. Known Limitations & Production Notes

1. **Local Storage Architecture**:
   Current data persistence operates via browser-standard LocalStorage. Multi-tenant remote access across distinct client machines requires future integration with an authoritative cloud relational backend (PostgreSQL / Cloud SQL) and server-authoritative sessions.
2. **Client-Side Secrets**:
   `VITE_*` environment variables in client-side bundles are not secure secrets. External cloud AI APIs should route through a backend proxy or an OS-level credential store.
3. **Windows Code Signing**:
   Production distribution outside enterprise test environments requires signing installer binaries with a trusted Authenticode code-signing certificate (EV or standard) to prevent Windows SmartScreen warnings.
4. **Auto-Updater**:
   Automatic over-the-air updates require an HTTPS release server with cryptographic signature verification (configured in `tauri.conf.json`). In Phase 15, updater functionality is documented but not hosted.
