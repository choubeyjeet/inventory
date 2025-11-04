import React, { useEffect, useState } from "react";
import { FaCartPlus, FaDownload, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import ModalBox from "../utils/ModalBox";
import SearchBar from "../components/SearchBar";

export default function Purchase() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentID, setCurrentID] = useState(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch Orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedQuery || "",
      });
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      const res = await axiosInstance.get(`/orders?${params.toString()}`);
      setOrders(res?.data?.orders || []);
      setTotalPages(res?.data?.totalPages || 1);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [debouncedQuery, page]);

  // Delete an Order
  const handleDeleteItem = async () => {
    try {
      await axiosInstance.delete(`/orders/${currentID}`);
      toast.success("Order deleted successfully");
      fetchOrders();
    } catch (err) {
      toast.error("Failed to delete order");
    } finally {
      setShowModal(false);
      setCurrentID(null);
    }
  };

  const closeModal = () => {
    setCurrentID(null);
    setShowModal(false);
  };

  // Download invoice
  const downloadInvoice = async (id) => {
    try {
      const response = await axiosInstance.get(`/orders/${id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  return (
    <div className="relative flex flex-col transition-all duration-300 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      <ToastContainer />

      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
          Purchase History
        </h1>
        <button
          onClick={() => navigate("/create-order")}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <FaCartPlus /> Create Purchase
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-4 flex flex-wrap gap-4 justify-between items-center border-b border-gray-300 dark:border-gray-700">
        {/* Date Filters */}
        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 ml-3">
          <div className="flex items-center gap-2">
            <label className="font-medium">From:</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="font-medium">To:</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              fetchOrders();
            }}
            disabled={!fromDate && !toDate && !debouncedQuery}
            className={`flex items-center justify-center gap-2 px-4 py-1.5 text-sm sm:text-base rounded-lg transition duration-200 ${
              !fromDate && !toDate && !debouncedQuery
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Filter
          </button>
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
              setQuery("");
              setPage(1);
              fetchOrders();
            }}
            className="flex items-center justify-center gap-2 px-4 py-1.5 text-sm sm:text-base rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition duration-200"
          >
            Clear
          </button>
        </div>

        {/* Search */}
        <SearchBar
          value={query}
          setQuery={setQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Order by name, email, or ID..."
        />
      </div>

      {/* Orders List */}
      <div className="p-4 sm:p-6 flex-1">
        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Loading orders...
          </p>
        ) : orders?.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            No orders found.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders?.map((order) => (
                <div
                  key={order._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-base mb-1">
                      {order?.customer?.name || "Unnamed Customer"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Order ID: {order?._id || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {order?.customer?.email || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Total Amount:{" "}
                      <span className="font-semibold text-blue-500 dark:text-blue-400">
                        ₹{order?.totalAmount.toFixed(2)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      GST: ₹{order?.totalGST.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Date: {new Date(order?.createdAt).toLocaleString()}
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
                      onClick={() => downloadInvoice(order._id)}
                      className="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition"
                    >
                      <FaDownload />
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(true);
                        setCurrentID(order._id);
                      }}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded-md border dark:border-gray-700 ${
                  page === 1
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                Prev
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-3 py-1 rounded-md border dark:border-gray-700 ${
                  page === totalPages
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                    : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <ModalBox title="Confirm Delete" onClose={closeModal}>
          <p className="mb-4">Are you sure you want to delete this order?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-gray-400 dark:bg-gray-600 text-white hover:bg-gray-500 dark:hover:bg-gray-500 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </ModalBox>
      )}
    </div>
  );
}
