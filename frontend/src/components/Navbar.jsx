import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaMoon, FaSun, FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login"; // you can use useNavigate() here instead
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-lightCard dark:bg-neutral-darkCard shadow-md flex items-center justify-between px-6 z-30">
      {/* Left */}
      <div className="text-xl font-semibold text-primary">Inventory Dashboard</div>

      {/* Right */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:scale-105 transition"
        >
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:scale-105 transition">
          <FaBell className="text-gray-800 dark:text-gray-200" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(!openMenu)}
            className="p-1 rounded-full hover:scale-105 transition"
          >
            <FaUserCircle className="text-2xl text-gray-700 dark:text-gray-300 cursor-pointer" />
          </button>

          {/* Dropdown */}
          {openMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 py-2 animate-fadeIn z-50">
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaUser /> Profile
              </button>
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaCog /> Settings
              </button>
              <hr className="border-gray-200 dark:border-gray-700 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
