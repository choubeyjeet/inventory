import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import {
  FaBoxOpen,
  FaDollarSign,
  FaUsers,
  FaShoppingCart,
  FaExclamationTriangle,
  FaClipboardList,
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
  ComposedChart,
  CartesianGrid,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(""); // optional month filter
  const [category, setCategory] = useState([]);

  const pieColors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSales = async () => {
      try {
        let url = `/dashboard/sales?year=${year}`;
        if (month) url += `&month=${month}`;
        const res = await axiosInstance.get(url);
        setSalesData(res.data);
      } catch (err) {
        console.error("Failed to load sales analytics:", err);
      }
    };



   


    fetchDashboard();
    fetchSales();
   
  }, [year, month]);

  const fetchCategorySales = async () => {
      try {
        let url = `/dashboard/product-category`;
     
        const res = await axiosInstance.get(url);
        setCategory(res.data);
      } catch (err) {
        console.error("Failed to load sales analytics:", err);
      }
    };
useEffect(()=>{
fetchCategorySales()
}, [])

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-600">
        Loading Dashboard...
      </div>
    );

  if (!stats)
    return (
      <div className="flex items-center justify-center h-screen text-xl text-red-600">
        Failed to load dashboard data
      </div>
    );

  const cards = [
    {
      label: "Total Products",
      value: stats.totalProducts,
      icon: <FaBoxOpen />,
      color: "bg-blue-500",
    },
    {
      label: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaDollarSign />,
      color: "bg-green-500",
    },
    {
      label: "Customers",
      value: stats.totalCustomers || 0,
      icon: <FaUsers />,
      color: "bg-yellow-500",
    },
    {
      label: "Orders",
      value: stats.totalOrders,
      icon: <FaShoppingCart />,
      color: "bg-purple-500",
    },
  ];

  const months = [
    { name: "All Months", value: "" },
    { name: "January", value: 1 },
    { name: "February", value: 2 },
    { name: "March", value: 3 },
    { name: "April", value: 4 },
    { name: "May", value: 5 },
    { name: "June", value: 6 },
    { name: "July", value: 7 },
    { name: "August", value: 8 },
    { name: "September", value: 9 },
    { name: "October", value: 10 },
    { name: "November", value: 11 },
    { name: "December", value: 12 },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Dashboard Overview
      </h1>

      {/* 🔹 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {cards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 flex items-center justify-between hover:scale-105 transition-transform"
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

      {/* 🔹 Year / Month Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-gray-600 dark:text-gray-300 mb-1 font-medium">
            Select Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-md p-2"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-600 dark:text-gray-300 mb-1 font-medium">
            Select Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-md p-2"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔹 Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            {month
              ? `${months.find((m) => m.value == month)?.name} ${year} Sales`
              : `Monthly Sales Trend (${year})`}
          </h2>
         
  
  <ResponsiveContainer width="100%" height={350}>
    <ComposedChart data={salesData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis
        yAxisId="left"
        orientation="left"
        label={{
          value: "Sales (₹)",
          angle: -90,
          position: "insideLeft",
        }}
      />
      <YAxis
        yAxisId="right"
        orientation="right"
        label={{
          value: "Orders",
          angle: 90,
          position: "insideRight",
        }}
      />
      <Tooltip
        formatter={(value, name) => {
          if (name === "Sales (₹)") return [`₹${value.toLocaleString()}`, name];
          return [value, name];
        }}
      />
      <Legend />
      <Bar
        yAxisId="left"
        dataKey="totalSales"
        fill="#3B82F6"
        name="Sales (₹)"
        barSize={40}
      />
      <Line
        yAxisId="right"
        type="monotone"
        dataKey="totalOrders"
        stroke="#10B981"
        name="Orders"
        strokeWidth={3}
        dot={{ r: 4 }}
        activeDot={{ r: 6 }}
      />
    </ComposedChart>
  </ResponsiveContainer>
 

        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Product Category Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={category}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {pieColors.map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: "#1F2937", color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>


         <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md mb-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
       
          <FaMoneyBill1Wave className="text-yellow-500" /> Month Wise Sale
        </h2>
        {salesData?.length ? (
          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Month</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Total Orders</th>
              </tr>
            </thead>
            <tbody>
              {salesData?.map((item, idx) => (
               <tr key={`items_${idx}`} className="border-t border-gray-200 dark:border-gray-800">
                
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{item.month}</td>
                  <td className="p-3">₹{item.totalSales}</td>
                  <td className="p-3 text-red-500 font-semibold">{item.totalOrders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No Data Found.</p>
        )}
      </div>

      {/* 🔹 Low Stock Items */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md mb-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          <FaExclamationTriangle className="text-yellow-500" /> Low Stock Items
        </h2>
        {stats.lowStockItems.length ? (
          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockItems.map((item, idx) => (
                <tr key={item._id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">₹{item.price}</td>
                  <td className="p-3 text-red-500 font-semibold">{item.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">All stocks are healthy ✅</p>
        )}
      </div>

      {/* 🔹 Recent Orders */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          <FaClipboardList className="text-blue-500" /> Recent Orders
        </h2>
        {stats.recentOrders.length ? (
          <table className="w-full border-collapse text-left">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Email</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order, idx) => (
                <tr key={order._id} className="border-t border-gray-200 dark:border-gray-800">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3">{order.customer?.name || "N/A"}</td>
                  <td className="p-3 text-blue-500">{order.customer?.email || "N/A"}</td>
                  <td className="p-3 font-semibold">₹{order.totalAmount.toFixed(2)}</td>
                  <td className="p-3">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No recent orders found.</p>
        )}
      </div>
    </div>
  );
}
