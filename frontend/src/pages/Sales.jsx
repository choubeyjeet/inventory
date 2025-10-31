import React, { useEffect, useState } from "react";
import { FaCartPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

export default function Sales() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // Fetch Orders from API
  // -------------------------------
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/orders");
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // -------------------------------
  // Delete an Order
  // -------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await axiosInstance.delete(`/orders/${id}`);
      toast.success("Order deleted successfully");
      fetchOrders(); // refresh list
    } catch (err) {
      toast.error("Failed to delete order");
    }
  };

  return (
    <div className="relative flex flex-col transition-all duration-300 min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
          Orders History
        </h1>
        <button
          onClick={() => navigate("/create-order")}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <FaCartPlus /> Create Order
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex-1">
        {loading ? (
          <p className="text-center text-gray-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    {order.customer?.name || "Unnamed Customer"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Email: {order.customer?.email || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Total Amount:{" "}
                    <span className="font-semibold text-blue-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    GST: ₹{order.totalGST.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Date: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="mt-4 flex justify-between gap-2">
                  <button
                    onClick={() => navigate(`/create-order/${order._id}`)}
                    className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition"
                  >
                    View / Edit
                  </button>

                  <button
                    onClick={() => handleDelete(order._id)}
                    className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
