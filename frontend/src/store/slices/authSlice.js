import { createSlice } from "@reduxjs/toolkit";

const storedUser = localStorage.getItem("pp360_user");
const storedToken = localStorage.getItem("pp360_token");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedToken || null,
  isAuthenticated: !!storedToken,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.error = null;
      if (user) localStorage.setItem("pp360_user", JSON.stringify(user));
      if (accessToken) localStorage.setItem("pp360_token", accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("pp360_user");
      localStorage.removeItem("pp360_token");
    },
    setAuthLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem("pp360_user", JSON.stringify(state.user));
    },
  },
});

export const { setCredentials, logout, setAuthLoading, setAuthError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
