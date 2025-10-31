// src/pages/Dashboard.jsx
import React from "react";
import {
  FaBoxOpen,
  FaDollarSign,
  FaUsers,
  FaShoppingCart,
} from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const stats = [
    {
      label: "Total Products",
      value: 248,
      icon: <FaBoxOpen />,
      color: "bg-blue-500",
    },
    {
      label: "Revenue",
      value: "$12,430",
      icon: <FaDollarSign />,
      color: "bg-green-500",
    },
    {
      label: "Customers",
      value: 893,
      icon: <FaUsers />,
      color: "bg-yellow-500",
    },
    {
      label: "Orders",
      value: 124,
      icon: <FaShoppingCart />,
      color: "bg-purple-500",
    },
  ];

  const salesData = [
    { month: "Jan", sales: 3000 },
    { month: "Feb", sales: 4200 },
    { month: "Mar", sales: 3900 },
    { month: "Apr", sales: 5800 },
    { month: "May", sales: 6700 },
    { month: "Jun", sales: 6100 },
  ];

  const categoryData = [
    { name: "Electronics", value: 400 },
    { name: "Clothing", value: 300 },
    { name: "Groceries", value: 200 },
    { name: "Furniture", value: 100 },
  ];

  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <div className="p-6 lg:p-8 bg-neutral-lightBg dark:bg-neutral-darkBg min-h-screen transition-colors duration-300">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Dashboard Overview
      </h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 flex items-center justify-between transition transform hover:scale-105"
          >
            <div>
              <p className="text-gray-500 dark:text-gray-400">{stat.label}</p>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {stat.value}
              </h2>
            </div>
            <div className={`${stat.color} text-white p-4 rounded-full text-xl`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Sales Trend */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Monthly Sales Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ r: 5, fill: "#3B82F6" }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Product Category Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "none",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Recent Activities
        </h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="border-b border-gray-200 dark:border-gray-800 pb-3">
            🧾 New order placed by <span className="font-semibold">John Doe</span>
          </li>
          <li className="border-b border-gray-200 dark:border-gray-800 pb-3">
            📦 Product <span className="font-semibold">“Nike Shoes”</span> added to stock
          </li>
          <li className="border-b border-gray-200 dark:border-gray-800 pb-3">
            💵 Payment received from <span className="font-semibold">Sarah Lee</span>
          </li>
          <li>🚚 Order #453 shipped successfully</li>
        </ul>
      </div>
    </div>
  );
}
