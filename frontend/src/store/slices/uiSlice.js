import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toasts: [],
  sidebarOpen: true,
  currentViewMode: "list",
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    addToast: (state, action) => {
      const id = Date.now().toString();
      state.toasts.push({
        id,
        type: action.payload.type || "info",
        title: action.payload.title || "",
        message: action.payload.message || "",
        duration: action.payload.duration || 4000,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setViewMode: (state, action) => {
      state.currentViewMode = action.payload;
    },
  },
});

export const { addToast, removeToast, toggleSidebar, setSidebarOpen, setViewMode } = uiSlice.actions;
export default uiSlice.reducer;
