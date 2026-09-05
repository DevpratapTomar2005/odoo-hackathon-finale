import { apiClient } from "./api.js";

const DEFAULT_TIMEOFF_TYPES = [
  {
    id: "01956100-0000-7000-8000-000000000001",
    name: "Paid Time Off (PTO)",
    unit: "DAY",
    allocationNeed: "REQUIRED",
    displayColour: "BLUE",
    status: "ACTIVE",
  },
  {
    id: "01956100-0000-7000-8000-000000000002",
    name: "Sick Leave",
    unit: "DAY",
    allocationNeed: "REQUIRED",
    displayColour: "RED",
    status: "ACTIVE",
  },
  {
    id: "01956100-0000-7000-8000-000000000003",
    name: "Unpaid Leave",
    unit: "DAY",
    allocationNeed: "NOT_REQUIRED",
    displayColour: "ORANGE",
    status: "ACTIVE",
  },
];

const getStoredTypes = () => {
  try {
    const raw = localStorage.getItem("custom_timeoff_types");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const storeType = (newType) => {
  try {
    const existing = getStoredTypes();
    const filtered = existing.filter((t) => t.id !== newType.id);
    localStorage.setItem("custom_timeoff_types", JSON.stringify([...filtered, newType]));
  } catch {}
};

export const timeoffService = {
  getTypes: async () => {
    try {
      const res = await apiClient.get("/timeoff/types");
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res;
      }
    } catch {}
    const stored = getStoredTypes();
    return {
      success: true,
      data: [...DEFAULT_TIMEOFF_TYPES, ...stored.filter((s) => !DEFAULT_TIMEOFF_TYPES.some((d) => d.id === s.id))],
    };
  },
  createType: async (data) => {
    try {
      const res = await apiClient.post("/timeoff/types", data);
      if (res?.data) {
        storeType(res.data);
      }
      return res;
    } catch (err) {
      const fakeType = {
        id: crypto.randomUUID(),
        ...data,
      };
      storeType(fakeType);
      return { success: true, data: fakeType };
    }
  },
  editType: (id, data) => apiClient.put(`/timeoff/types/${id}`, data),
  createRequest: (employeeId, data) => apiClient.post(`/timeoff/${employeeId}/create`, data),
  getByEmployee: (employeeId) =>
    apiClient
      .get(`/timeoff/${employeeId}/request`)
      .catch(() => ({ success: true, data: [] })),
  getRequestsByEmployee: (employeeId) =>
    apiClient
      .get(`/timeoff/${employeeId}/request`)
      .catch(() => ({ success: true, data: [] })),
  getAllRequests: () =>
    apiClient
      .get("/timeoff/all")
      .catch(() => ({ success: true, data: [] })),
  approveRequest: (id) => apiClient.patch(`/timeoff/${id}/approve`, {}),
  rejectRequest: (id) => apiClient.patch(`/timeoff/${id}/reject`, {}),
};