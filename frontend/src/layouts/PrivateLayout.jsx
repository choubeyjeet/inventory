import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function PrivateLayout({ darkMode, toggleDarkMode }) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-lightBg dark:bg-neutral-darkBg transition-colors duration-300">
      {/* Navbar */}
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="flex flex-grow pt-16">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-grow p-6 overflow-y-auto ml-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
