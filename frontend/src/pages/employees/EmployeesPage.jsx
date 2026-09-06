import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { useEmployees, useCreateEmployee } from "../../hooks/useEmployee.js";
import { Badge } from "../../components/common/Badge.jsx";
import { LoadingSpinner } from "../../components/common/LoadingSpinner.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { Modal } from "../../components/common/Modal.jsx";
import { Pagination } from "../../components/common/Pagination.jsx";
import { Combobox } from "../../components/common/Combobox.jsx";
import { addToast } from "../../store/slices/uiSlice.js";
import { toTitleCase, fullName } from "../../utils/format.js";
import {
  Users,
  Search,
  LayoutGrid,
  List,
  Plus,
  Building2,
  Briefcase,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export function EmployeesPage() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "ADMIN";

  const { data: employeesRes, isLoading: loading } = useEmployees();
  const createEmployeeMutation = useCreateEmployee();

  const employees = employeesRes?.data || [];

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
    department: "Engineering",
    designation: "",
    status: "ACTIVE",
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = fullName(emp.firstName, emp.lastName).toLowerCase();
      const matchesSearch =
        name.includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase()) ||
        String(emp.employeeId || "").includes(search);
      const matchesDept = !deptFilter || emp.department === deptFilter;
      const matchesStatus = !statusFilter || emp.status === statusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  const departmentOptions = [
    { value: "Engineering", label: "Engineering" },
    { value: "Sales", label: "Sales" },
    { value: "Marketing", label: "Marketing" },
    { value: "HR", label: "HR" },
    { value: "Support", label: "Support" },
    { value: "Finance", label: "Finance" },
  ];

  const roleOptions = [
    { value: "EMPLOYEE", label: "Employee", sublabel: "Self-Service Portal Only" },
    { value: "HR_MANAGER", label: "HR Manager", sublabel: "Directory & Leave Approvals" },
    { value: "HR_PAYROLL", label: "HR Payroll User", sublabel: "Payruns & Payslips Processing" },
    { value: "PAYROLL_ADMIN", label: "HR Payroll Manager", sublabel: "Full Payroll & Salary Rules" },
    { value: "ADMIN", label: "Administrator", sublabel: "Full System Access" },
  ];

  const handleCreateEmployee = (e) => {
    e.preventDefault();
    if (!isAdmin) {
      dispatch(addToast({ type: "error", title: "Access Denied", message: "Only administrators can create new employee accounts." }));
      return;
    }

    if (!formData.firstname.trim() || !formData.lastname.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Name", message: "Please enter both first and last name." }));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      dispatch(addToast({ type: "error", title: "Invalid Email", message: "Please enter a valid email address." }));
      return;
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordPattern.test(formData.password)) {
      dispatch(addToast({ type: "error", title: "Weak Password", message: "Password must be at least 8 characters and include an uppercase letter, a number, and a special character." }));
      return;
    }

    if (!formData.designation.trim()) {
      dispatch(addToast({ type: "error", title: "Missing Designation", message: "Please enter a designation." }));
      return;
    }

    const payload = {
      firstname: (formData.firstname || "").trim().toLowerCase(),
      lastname: (formData.lastname || "").trim().toLowerCase(),
      email: (formData.email || "").trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      department: (formData.department || "engineering").trim().toLowerCase(),
      designation: (formData.designation || "staff").trim().toLowerCase(),
      status: formData.status || "ACTIVE",
    };

    createEmployeeMutation.mutate(payload, {
      onSuccess: () => {
        dispatch(addToast({ type: "success", title: "Employee Created", message: "New employee master profile initialized." }));
        setIsCreateModalOpen(false);
        setFormData({
          firstname: "",
          lastname: "",
          email: "",
          password: "",
          role: "EMPLOYEE",
          department: "Engineering",
          designation: "",
          status: "ACTIVE",
        });
      },
      onError: (err) => {
        dispatch(addToast({ type: "error", title: "Creation Failed", message: err.message || "Failed to create employee" }));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Employee Master Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Central hub for staff profiles, working contracts, and attendance records</p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Employee</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>Creation restricted to Administrator</span>
          </div>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, employee ID, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Sales">Sales</option>
            <option value="Marketing">Marketing</option>
            <option value="HR">HR</option>
            <option value="Support">Support</option>
            <option value="Finance">Finance</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="RESIGNED">Resigned</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="Kanban Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md cursor-pointer ${viewMode === "list" ? "bg-white text-indigo-600 shadow-2xs font-semibold" : "text-slate-500 hover:text-slate-800"}`}
              title="List Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching employee records..." />
      ) : filteredEmployees.length === 0 ? (
        <EmptyState
          title="No employees found"
          description={isAdmin ? "Create a new employee profile to get started." : "No employees matching the current filters."}
          icon={Users}
          action={
            isAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Create Employee
              </button>
            )
          }
        />
      ) : viewMode === "kanban" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="bg-white rounded-xl border border-slate-200/80 p-5 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {emp.firstName ? emp.firstName[0].toUpperCase() : "E"}
                    </div>
                    <Badge variant={emp.status}>{emp.status}</Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                    {fullName(emp.firstName, emp.lastName)}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{toTitleCase(emp.designation) || "Staff"}</span>
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{toTitleCase(emp.department) || "General"}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px] text-slate-400">ID: #{emp.employeeId}</span>
                  <span className="text-indigo-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    View Hub <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredEmployees.length}
            pageSize={pageSize}
            pageSizeOptions={[8, 12, 24, 48]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => navigate(`/employees/${emp.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                        {emp.firstName ? emp.firstName[0].toUpperCase() : "E"}
                      </div>
                      <span>
                        {fullName(emp.firstName, emp.lastName)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500">{emp.employeeId}</td>
                    <td className="px-4 py-3">{toTitleCase(emp.department)}</td>
                    <td className="px-4 py-3">{toTitleCase(emp.designation)}</td>
                    <td className="px-4 py-3 text-slate-500">{emp.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.status}>{emp.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-indigo-600 font-semibold hover:underline">Open Hub</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredEmployees.length}
            pageSize={pageSize}
            pageSizeOptions={[10, 25, 50, 100]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Employee Profile"
        >
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane"
                  value={formData.firstname}
                  onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doe"
                  value={formData.lastname}
                  onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g. jane.doe@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password</label>
              <input
                type="password"
                required
                placeholder="e.g. Password@1234 (Min 8 chars, uppercase, number & special char)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <Combobox
                  options={departmentOptions}
                  value={formData.department}
                  onChange={(val) => setFormData({ ...formData, department: val || "Engineering" })}
                  placeholder="Select Department"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Engineer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                <Combobox
                  options={roleOptions}
                  value={formData.role}
                  onChange={(val) => setFormData({ ...formData, role: val || "EMPLOYEE" })}
                  placeholder="Select Role"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="RESIGNED">Resigned</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createEmployeeMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}