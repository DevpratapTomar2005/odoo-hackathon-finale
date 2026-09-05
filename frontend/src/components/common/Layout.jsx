import React from "react";
import { Outlet } from "react-router";
import { Header } from "./Header.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { ToastContainer } from "./Toast.jsx";

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 md:pl-64 flex flex-col min-w-0 transition-all duration-200">
          <div className="p-6 max-w-7xl w-full mx-auto flex-1">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
