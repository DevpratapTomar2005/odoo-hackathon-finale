import React from "react";
import { Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/common/Layout.jsx";
import { ProtectedRoute } from "./components/common/ProtectedRoute.jsx";
import { LoginPage } from "./pages/auth/LoginPage.jsx";
import { DashboardPage } from "./pages/dashboard/DashboardPage.jsx";
import { EmployeesPage } from "./pages/employees/EmployeesPage.jsx";
import { EmployeeDetailPage } from "./pages/employees/EmployeeDetailPage.jsx";
import { ContractsPage } from "./pages/contracts/ContractsPage.jsx";
import { AttendancePage } from "./pages/attendance/AttendancePage.jsx";
import { TimeOffPage } from "./pages/timeoff/TimeOffPage.jsx";
import { PayrollPage } from "./pages/payroll/PayrollPage.jsx";
import { PayrunDetailPage } from "./pages/payroll/PayrunDetailPage.jsx";
import { PayslipDetailPage } from "./pages/payroll/PayslipDetailPage.jsx";
import { SalaryStructuresPage } from "./pages/payroll/SalaryStructuresPage.jsx";
import { SchedulesPage } from "./pages/schedules/SchedulesPage.jsx";
import { EmployeePortalPage } from "./pages/portal/EmployeePortalPage.jsx";

const HR_STAFF_ROLES = ["ADMIN", "HR_MANAGER", "HR_PAYROLL", "PAYROLL_ADMIN"];
const PAYROLL_ROLES = ["ADMIN", "HR_PAYROLL", "PAYROLL_ADMIN"];

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route element={<ProtectedRoute allowedRoles={HR_STAFF_ROLES} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route path="/contracts" element={<ContractsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/timeoff" element={<TimeOffPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={PAYROLL_ROLES} />}>
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/payroll/payrun/:id" element={<PayrunDetailPage />} />
            <Route path="/payroll/structures" element={<SalaryStructuresPage />} />
          </Route>

          <Route path="/payroll/payslip/:id" element={<PayslipDetailPage />} />
          <Route path="/portal" element={<EmployeePortalPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
