import { apiClient } from "./api.js";

export const payrollService = {
  createPayrun: (data) => apiClient.post("/payrun", data),
  getAllPayruns: () => apiClient.get("/payrun"),
  getPayrunById: (id) => apiClient.get(`/payrun/${id}`),
  computePayrun: (id) => apiClient.post(`/payrun/${id}/compute`, {}),
  validatePayrun: (id) => apiClient.post(`/payrun/${id}/validate`, {}),
  markPaid: (id) => apiClient.post(`/payrun/${id}/mark-paid`, {}),
  sendPayslips: (id) => apiClient.post(`/payrun/${id}/send-payslips`, {}),
  getAllPayslips: () => apiClient.get("/payslip"),
  getPayslipsByEmployee: (employeeId) => apiClient.get(`/payslip/employee/${employeeId}`),
  getPayslipById: (id) => apiClient.get(`/payslip/${id}`),
  getPayslipPdfUrl: (id) => `${apiClient.defaults.baseURL}/payslip/${id}/print`,
  downloadPayslipPdf: async (id, filename = `payslip-${id}.pdf`) => {
    const response = await apiClient.get(`/payslip/${id}/print`, {
      responseType: "blob",
    });
    const blob = new Blob([response], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  getDashboard: (params) => apiClient.get("/payroll-dashboard", { params }),
};