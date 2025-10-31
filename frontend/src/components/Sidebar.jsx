import React, { useState } from "react";
import {
  FaTachometerAlt,
  FaBoxOpen,
  FaShoppingCart,
  FaChartPie,
  FaUsers,
  FaFileInvoice,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const [hovered, setHovered] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: <FaTachometerAlt />, path: "/dashboard" },
    { name: "Items", icon: <FaBoxOpen />, path: "/items" },
    { name: "Sales", icon: <FaShoppingCart />, path: "/sales" },
    // { name: "Invoice", icon: <FaFileInvoice />, path: "/invoice" },
    { name: "Reports", icon: <FaChartPie />, path: "/reports" },
    { name: "Suppliers", icon: <FaUsers />, path: "/suppliers" },
  ];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed top-0 left-0 h-full mt-[65px] ${
        hovered ? "w-64" : "w-20"
      } bg-neutral-lightCard dark:bg-neutral-darkCard shadow-lg flex flex-col justify-between transition-all duration-300 z-40`}
    >
     
    

      {/* Menu */}
      <nav className="flex-grow mt-6">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2 my-1 transition-colors group ${
                isActive
                  ? "bg-primary text-white"
                  : "text-neutral-lightText dark:text-neutral-darkText hover:bg-neutral-lightBg dark:hover:bg-neutral-darkBg"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {hovered && <span>{item.name}</span>}

            {!hovered && (
              <span className="absolute left-full ml-3 px-2 py-1 text-xs bg-gray-800 text-white rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 text-center text-xs text-secondary-light dark:text-secondary-dark">
        {hovered ? <p>© 2025 Inventory System</p> : <p>©</p>}
      </div>
    </div>
  );
}
