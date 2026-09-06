# PeoplePay360 — HR & Payroll

**An Integrated Human Resource and Payroll Operations Platform**

Built for the Odoo Hackathon Finale 2026.

Most basic HR tools store employee details, attendance, leave, and salary data as separate, disconnected records. Real HR and payroll teams need these to work together, an employee may have multiple contracts over time, but payroll must use the one applicable to the period, hours come from an assigned schedule, leave balances depend on allocations and approvals, and payroll must transform all of it into an understandable, auditable payslip before payment.

PeoplePay360 implements payroll and HR functionality. Attendance, time off, contracts, salary rules/structures, payruns, and payslips as a REST API consumed by a React SPA, with the **Employee** record acting as the central hub connecting everything else.

---

## Table of Contents
- [Project Overview](#project-overview)
- [User Roles](#user-roles)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start (Local Development)](#quick-start-local-development)
- [Database, Migrations & Seeding](#database-migrations--seeding)
- [API Endpoints](#api-endpoints)
- [Scripts & Useful Commands](#scripts--useful-commands)
- [End-to-End Flow](#end-to-end-flow)
- [Linting & Formatting](#linting--formatting)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Mockups](#mockups)
- [Contributing](#contributing)
- [Team & Contact](#team--contact)
- [License](#license)

---

## Project Overview

The backend uses PostgreSQL with Drizzle ORM for schema, queries, and migrations, and exposes a REST API under `/api/*`. The frontend is a Vite-powered React SPA that talks to that API. The focus of the build is on business logic and data relationships, period-based contract selection, schedule-driven hour calculations, leave-balance consumption, and sequenced salary-rule computation rather than surface-level UI.

## User Roles

| Role | Access |
|---|---|
| **Employee** | Views own profile, attendance, and leave balances. Can create attendance entries and time-off requests. No HR/payroll admin access. |
| **HR Manager** | Full CRUD on Employees, Attendance, Contracts, Working Schedules, and Time Off. Approves/refuses time-off requests. No payroll access. |
| **HR Payroll User** | All HR Manager permissions + Create/Read/Update on Payruns and Payslips. Read-only on Salary Structures/Rules. |
| **HR Payroll Manager** | All HR Payroll User permissions + full CRUD on Payruns, Payslips, Salary Structures, and Salary Rules. |
| **Admin** | Full access to all modules, plus user management, role assignment, and system administration. |

## Features

- User authentication (JWT-based)
- Employee master management (profiles, department, manager, schedule, status)
- Contract management with period-based selection (payroll uses only the contract active for the payroll period)
- Working schedules — weekly pattern builder with automatic total-hours calculation
- Attendance tracking with manual corrections for authorized users
- Time off — configurable leave types, allocations, requests, and an approval workflow that auto-deducts balances
- Salary Structures & Salary Rules — sequenced, configurable computation (fixed / percentage / formula) driving real payslip output
- Payrun processing — two-step wizard (scope/period → employee selection), then Compute → Validate → Mark Paid → Send Payslips
- Payslip PDF generation (`pdfkit`) and bulk email delivery
- Payroll Dashboard aggregating live data across employees, attendance, time off, contracts, and payroll
- Frontend SPA with React, React Router, React Query, Redux Toolkit, and Tailwind CSS

## Architecture

```
frontend/   React application (Vite)
backend/    Node.js Express API, Drizzle ORM, PostgreSQL
```

The backend follows a layered structure: **routes** → **middlewares** (auth verification, role authorization, input validation) → **controllers** → **db/schema** (Drizzle), with shared **utils** for error handling, API responses, JWT issuance, salary formula evaluation, and PDF generation, plus a **services** layer for email delivery. The frontend communicates with the backend via a configured API base URL, with CORS restricted to the frontend origin (`CLIENT_URL`).

## Tech Stack

Versions below are taken directly from `package.json` in each folder.

**Backend** (`backend/package.json`)
- Node.js (ES modules), **Express 5** (`^5.2.1`)
- **Drizzle ORM `^1.0.0-rc.4`** + **PostgreSQL** (`pg ^8.23.0`), **`drizzle-kit ^1.0.0-rc.4`** for migrations — note both are pre-1.0 release candidates
- **`jsonwebtoken ^9.0.3`** for auth, plus `cookie-parser` and `cors`
- **`zod ^4.5.4`** for request validation (`validateInput` middleware)
- **`bcrypt ^6.0.0`** for password hashing
- **`uuidv7`** for generating sortable unique IDs (likely used for primary keys)
- **`pdfkit ^0.20.2`** for payslip PDF generation
- `dotenv` for environment variable loading
- Centralized error handling (`globalErrorHandler` middleware, `ApiError`/`ApiResponse` utils)

> ⚠️ The `dev` script runs `nodemon server.js`, but `nodemon` is **not listed** in `dependencies` or `devDependencies`. Either it's expected to be installed globally, or it's missing from `package.json` — add it as a devDependency (`npm install -D nodemon`) so `npm run dev` works on a clean clone.

**Frontend** (`frontend/package.json`)
- **React 19** (`^19.2.8`) + **Vite** (`^8.2.2`)
- **React Router** — both `react-router` and `react-router-dom` are installed (`^7.18.3`); confirm which one is actually imported across the app to avoid carrying an unused duplicate dependency
- **Redux Toolkit** (`@reduxjs/toolkit`) + `react-redux` for state
- **TanStack React Query** (`^5.102.8`) for server-state/data fetching
- **Axios** (`^1.20.0`) as the HTTP client (`services/api/api.js`)
- **Tailwind CSS 4** (`^4.3.3`) via the `@tailwindcss/vite` plugin (no separate PostCSS config needed)
- `clsx` + `tailwind-merge` — backing `utils/cn.js` for conditional class merging
- `lucide-react` for icons
- **ESLint 10** with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`

## Project Structure

```
odoo-hackathon-finale/
├── backend/
│   ├── server.js                        # Boots the app: connectDB() then app.listen(PORT)
│   ├── drizzle.config.js                # Drizzle ORM / migration config
│   ├── .env.example
│   ├── drizzle/                          # Generated migration files
│   └── src/
│       ├── app.js                        # Express app, route registration
│       ├── config/
│       │   └── env.config.js             # Centralized environment variable loading
│       ├── controllers/                  # One controller per resource
│       │   ├── allocation.controller.js
│       │   ├── attendence.controller.js
│       │   ├── auth.controller.js
│       │   ├── contract.controller.js
│       │   ├── employee.controller.js
│       │   ├── payrollDashboard.controller.js
│       │   ├── payrun.controller.js
│       │   ├── payslip.controller.js
│       │   ├── salaryRule.controller.js
│       │   ├── salaryStructure.controller.js
│       │   ├── timeoff.controller.js
│       │   ├── user.controller.js
│       │   └── weeklySchedule.controller.js
│       ├── db/
│       │   ├── db.js                     # DB connection setup
│       │   ├── schema.js                 # Drizzle schema definitions
│       │   └── seed.js                   # Sample data seeder (npm run seed)
│       ├── middlewares/
│       │   ├── authorizeRole.middleware.js     # Role-based access control
│       │   ├── globalErrorHandler.middleware.js
│       │   ├── validateInput.middleware.js     # Zod request validation
│       │   └── verifyAuth.middleware.js        # JWT verification
│       ├── models/                       # Drizzle/Zod schemas per resource
│       │   ├── allocation.schema.js
│       │   ├── attendence.schema.js
│       │   ├── auth.schema.js
│       │   ├── contract.schema.js
│       │   ├── employee.schema.js
│       │   ├── payrolldashboard.schema.js
│       │   ├── payrun.schema.js
│       │   ├── payslip.schema.js
│       │   ├── salaryrule.schema.js
│       │   ├── salarystructure.schema.js
│       │   ├── timeoff.schema.js
│       │   ├── user.schema.js
│       │   └── weeklySchedule.schema.js
│       ├── routes/                       # One route file per resource
│       │   ├── allocation.route.js
│       │   ├── attendence.route.js
│       │   ├── auth.route.js
│       │   ├── contract.route.js
│       │   ├── employee.routes.js
│       │   ├── payrolldashboard.route.js
│       │   ├── payrun.routes.js
│       │   ├── payslip.route.js
│       │   ├── salaryrule.route.js
│       │   ├── salarystructure.routes.js
│       │   ├── timeoff.route.js
│       │   ├── user.route.js
│       │   └── weeklySchedule.routes.js
│       ├── services/
│       │   └── email.service.js          # Bulk payslip email delivery
│       └── utils/
│           ├── ApiError.js
│           ├── ApiResponse.js
│           ├── AsyncHandler.js
│           ├── FormulaEvaluator.js       # Evaluates salary rule formulas (e.g. BASIC * 0.10 + 500)
│           ├── GeneratePaySlipPdf.js     # pdfkit-based payslip PDF generation
│           └── gennerateTokens.js        # JWT issuance
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── assets/
│   │   ├── components/common/
│   │   │   ├── AttendanceWidget.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Combobox.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Toast.jsx
│   │   ├── hooks/                        # Per-domain data-fetching hooks (React Query)
│   │   │   ├── useAttendence.js
│   │   │   ├── useAuth.js
│   │   │   ├── useContract.js
│   │   │   ├── useEmployee.js
│   │   │   ├── usePayroll.js
│   │   │   ├── useSchedules.js
│   │   │   └── useTimeOffAndAllocations.js
│   │   ├── pages/
│   │   │   ├── attendance/AttendancePage.jsx
│   │   │   ├── auth/LoginPage.jsx
│   │   │   ├── contracts/ContractsPage.jsx
│   │   │   ├── dashboard/DashboardPage.jsx
│   │   │   ├── employees/{EmployeeDetailPage.jsx, EmployeesPage.jsx}
│   │   │   ├── payroll/{PayrollPage.jsx, PayrunDetailPage.jsx, PayslipDetailPage.jsx, SalaryStructuresPage.jsx}
│   │   │   ├── portal/EmployeePortalPage.jsx
│   │   │   ├── schedules/SchedulesPage.jsx
│   │   │   └── timeoff/TimeOffPage.jsx
│   │   ├── services/api/                 # API service layer — see note below on duplicate files
│   │   │   ├── allocation.service.js
│   │   │   ├── api.js                    # Base axios/fetch client config
│   │   │   ├── attendance.service.js
│   │   │   ├── auth.service.js
│   │   │   ├── contract.service.js
│   │   │   ├── employee.service.js
│   │   │   ├── payroll.service.js
│   │   │   ├── salaryRule.service.js
│   │   │   ├── salaryStructure.service.js
│   │   │   ├── timeoff.service.js
│   │   │   ├── user.service.js
│   │   │   └── weeklySchedule.service.js
│   │   ├── store/
│   │   │   ├── index.js                  # Redux store setup
│   │   │   └── slices/{authSlice.js, uiSlice.js}
│   │   └── utils/
│   │       ├── cn.js                     # Tailwind class-merging helper
│   │       └── format.js
│   ├── .env / .env.example
│   ├── eslint.config.js
│   ├── index.html
│   └── vite.config.js
└── README.md
```

> **Naming notes:**
> - Several **backend** filenames use `attendence` (not `attendance`) and `gennerateTokens` (not `generateTokens`) **consistently** across controllers, models, and routes — treat these as the codebase's actual spelling, not typos to "fix" on one side only.
> - The **frontend** `services/api/` folder, by contrast, has genuine duplication that looks unintentional: `allocation.service.js` appears to have an accidental duplicate (`allocation..service.js`, with a double dot) sitting alongside it, and there are **three** near-identical attendance service files (`attendance.service.js`, `attendence.service.js`, `attandence.service.js`) with three different spellings. Only one of these is likely actually imported anywhere — worth auditing and deleting the stale duplicates before this goes further, since it's easy to edit the wrong file and have the change silently not apply.

## Prerequisites

- Node.js v18+
- npm (or pnpm/yarn — commands below use npm)
- PostgreSQL (local install or containerized)


## Environment Variables

**`backend/.env`** (copy from `backend/.env.example`)

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (e.g. `3000`) |
| `DATABASE_URL` | Postgres connection string — `postgres://USER:PASSWORD@HOST:PORT/DATABASE` |
| `JWT_SECRET` | Secret used to sign/verify JWTs |
| `CLIENT_URL` | Frontend origin allowed for CORS |

**`frontend/.env`** (Vite)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:3000` |

Copy each `.env.example` to `.env` and fill in real values before starting either service.

## Quick Start (Local Development)

1. Start PostgreSQL (local or Docker).
2. Configure `backend/.env`.
3. Install dependencies and seed the DB (optional).
4. Start backend and frontend dev servers.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # then fill in DATABASE_URL, JWT_SECRET, CLIENT_URL, PORT

npm run seed                 # optional — runs src/db/seed.js, adds sample data
npm run dev                  # nodemon server.js — hot reload dev server
# or, for production:
npm start                    # node server.js
```

`server.js` boots the app by calling `connectDB()` then `app.listen(PORT)`. A health-check endpoint is available at `GET /health`.

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env

npm run dev                  # Vite dev server (default: http://localhost:5173)
npm run build                # production build
npm run preview              # preview the production build locally
```

## Database, Migrations & Seeding

- Postgres via the `pg` driver, managed with Drizzle ORM.
- `drizzle.config.js` configures schema/migration generation via `drizzle-kit` (dev dependency).
- Seed script: `npm run seed` → runs `node src/db/seed.js`, populating sample employees, contracts, schedules, attendance, leave allocations, salary structures, and a demo payrun/payslip.

Typical setup:
1. Confirm `DATABASE_URL` points to a reachable Postgres instance.
2. Run migrations via `drizzle-kit` if migration files are present.
3. Run `npm run seed` to load sample data.

## API Endpoints

All routes are registered in `backend/src/app.js` under `/api/*`. Route file naming is preserved exactly below (note the lowercase, no-hyphen style on some resources):

| Route file | Likely mount path | Purpose |
|---|---|---|
| `GET /health` | `/health` | Health check |
| `auth.route.js` | `/api/auth` | Authentication (login, token issuance) |
| `user.route.js` | `/api/user` | User management |
| `employee.routes.js` | `/api/employee` | Employee management |
| `weeklySchedule.routes.js` | `/api/weekly-schedule` | Working schedule management |
| `contract.route.js` | `/api/contract` | Contracts |
| `attendence.route.js` | `/api/attendence` | Attendance records & corrections |
| `timeoff.route.js` | `/api/timeoff` | Time-off requests |
| `allocation.route.js` | `/api/allocation` | Leave allocations |
| `salarystructure.routes.js` | `/api/salary-structure` | Salary structure management |
| `salaryrule.route.js` | `/api/salary-rule` | Salary rule management |
| `payrun.routes.js` | `/api/payrun` | Payrun processing (compute/validate/mark paid/send) |
| `payslip.route.js` | `/api/payslip` | Payslip generation & retrieval |
| `payrolldashboard.route.js` | `/api/payroll-dashboard` | Aggregated payroll dashboard data |

Every route is protected by `verifyAuth.middleware.js` and `authorizeRole.middleware.js` where applicable, with request bodies validated by `validateInput.middleware.js` (Zod schemas under `src/models/`). Consult each route file directly for exact paths, request/response shapes, and required roles.

## Scripts & Useful Commands

**Backend**
```bash
npm install
npm run dev        # nodemon server.js (development)
npm start          # node server.js (production)
npm run seed        # run DB seed script
```

**Frontend**
```bash
npm install
npm run dev         # Vite dev server
npm run build        # production build
npm run preview      # preview built site
npm run lint          # ESLint
```

**Misc**
```bash
curl http://localhost:3000/health   # verify backend is up
```
Make sure `CLIENT_URL` in the backend `.env` matches the frontend's actual origin so CORS allows requests through.

## End-to-End Flow

1. Employees are managed via Kanban/List views, acting as the hub for related records.
2. Contracts and Working Schedules attach to employees, giving payroll the specific terms and time patterns valid for the period.
3. Attendance captures daily presence, with authorized correction of exceptions.
4. Time Off lifecycle: define types → allocate balances → request → approve/reject → auto-deduct from balances.
5. Salary Structures and sequenced Salary Rules define how earnings, deductions, and net salary compute.
6. A Payrun is created (scope + period, then employee selection) and processed: **Compute → Validate → Mark Paid → Send Payslips**.
7. Payslips show a per-rule computed breakdown, using the applicable contract and assigned salary structure.
8. Finalized Payruns are archived as historical records; individual Payslip PDFs can be generated and emailed.
9. The Payroll Dashboard aggregates live data across Employees, Contracts, Attendance, Time Off, and Payroll for filtered reporting.

## Linting & Formatting

```bash
cd frontend
npm run lint
```

Frontend linting is configured via `eslint.config.js`. Add Prettier or additional formatting tooling as your team's style guide requires.


## Troubleshooting

| Symptom | Likely Cause / Fix |
|---|---|
| DB connection errors | Verify `DATABASE_URL` and that Postgres accepts connections from your host |
| JWT auth failures | Confirm `JWT_SECRET` is identical across any services that sign/verify tokens |
| CORS-blocked requests | Set `CLIENT_URL` to the exact frontend origin, including protocol (e.g. `https://your-domain.com`) |
| Port already in use | Change `PORT` in `backend/.env` |



