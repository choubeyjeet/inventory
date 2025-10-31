import React, { useState, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Dashboard, Login } from "./lazyComponents";
import Items from "./pages/Items";
import { ToastContainer } from "react-toastify";
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";
import Signup from "./pages/Signup";
import ProtectedRoute from "./utils/ProtectedRoute"; // ✅ new import
import Invoice from "./pages/Invoice";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <ToastContainer />
      <div className="min-h-screen bg-neutral-lightBg dark:bg-neutral-darkBg transition-colors duration-300">
        <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
          <Routes>
            {/* 🔓 Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* 🔐 Private Routes (Protected + Layout) */}
            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <PrivateLayout
                    darkMode={darkMode}
                    toggleDarkMode={() => setDarkMode(!darkMode)}
                  />
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/items" element={<Items />} />
                <Route path="/invoice" element={<Invoice />} />
                
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}
