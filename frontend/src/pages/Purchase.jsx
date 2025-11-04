import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { BiSolidPurchaseTag } from "react-icons/bi";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import ModalBox from "../utils/ModalBox";
import SearchBar from "../components/SearchBar";

export default function Purchase() {
  const [purchases, setPurchases] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [currentPurchase, setCurrentPurchase] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch Purchase Orders
  const fetchPurchases = async () => {
    try {
      const params = { page, limit };
      if (debouncedQuery) params.search = debouncedQuery;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axiosInstance.get("/purchases", { params });

      setPurchases(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch purchases");
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, debouncedQuery, fromDate, toDate]);

  // Modal Control
  const openModal = (type, purchase = null) => {
    setModalType(type);
    setCurrentPurchase(purchase);
  };

  const closeModal = () => {
    setModalType(null);
    setCurrentPurchase(null);
  };

  // Delete Purchase Order
  const handleDeletePurchase = async () => {
    try {
      await axiosInstance.delete(`/purchases/${currentPurchase._id}`);
      toast.success("Purchase deleted successfully");
      fetchPurchases();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete purchase");
    }
  };

  return (
    <div className="relative flex flex-col transition-all duration-300">
      <ToastContainer />

      <div className="flex-1 p-4 sm:p-6 bg-neutral-lightBg dark:bg-neutral-darkBg text-neutral-lightText dark:text-neutral-darkText min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Purchase Orders</h1>
          <button
            onClick={() => navigate("/create-purchase")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <BiSolidPurchaseTag /> Add Purchase
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="ml-2 px-2 py-1 border rounded-lg focus:outline-none focus:ring focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="ml-2 px-2 py-1 border rounded-lg focus:outline-none focus:ring focus:ring-primary/40"
              />
            </div>
            <button
              onClick={fetchPurchases}
              className="px-3 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark"
            >
              Filter
            </button>
          </div>
          <SearchBar
            setQuery={setQuery}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by supplier name or item name"
          />

        
        </div>

        {/* Table */}
        <div className="bg-neutral-lightCard dark:bg-neutral-darkCard shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-light dark:bg-secondary-dark text-white text-left">
              <tr>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">No of Items</th>
                 <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Total Amount (₹)</th>
                <th className="px-4 py-3">GST (₹)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length > 0 ? (
                purchases.map((order) => (
                  <tr
                    key={order._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-2 font-medium">
                      {order.supplier?.name || "-"}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">{order.items?.length || 0}</td>
                         <td className="px-4 py-2">{order?.description}</td>
                    <td className="px-4 py-2">{order?.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-2">{order?.totalGST.toFixed(2)}</td>
                    <td className="px-4 py-2 text-center space-x-2">
                       <button
                        onClick={() => navigate(`/create-purchase/${order._id}`)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openModal("delete", order)}
                        className="text-danger hover:text-danger-dark"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No purchases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-3 mt-6 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 bg-secondary text-white rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 bg-secondary text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {modalType === "delete" && (
        <ModalBox title="Confirm Delete" onClose={closeModal}>
          <p className="mb-4">
            Are you sure you want to delete this purchase from{" "}
            <span className="font-semibold text-danger">
              {currentPurchase?.supplier?.name}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark"
            >
              Cancel
            </button>
            <button
              onClick={handleDeletePurchase}
              className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger-dark"
            >
              Delete
            </button>
          </div>
        </ModalBox>
      )}
    </div>
  );
}
