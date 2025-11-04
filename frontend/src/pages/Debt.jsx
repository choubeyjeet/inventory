import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import ModalBox from "../utils/ModalBox";
import SearchBar from "../components/SearchBar";

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [currentDebt, setCurrentDebt] = useState(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch debts
  const fetchDebts = async () => {
    try {
      const params = { page, limit };
      if (debouncedQuery) params.search = debouncedQuery;

      const res = await axiosInstance.get("/debts", { params });
      setDebts(res.data.debts);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch debts");
    }
  };

  useEffect(() => {
    fetchDebts();
  }, [page, debouncedQuery]);

  // Modal control
  const openModal = (type, debt = null) => {
    setModalType(type);
    setCurrentDebt(debt);
  };
  const closeModal = () => {
    setModalType(null);
    setCurrentDebt(null);
  };

  // CRUD
  const handleAddDebt = async (newDebt) => {
    try {
      await axiosInstance.post("/debts", newDebt);
      toast.success("Debt added successfully");
      fetchDebts();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add debt");
    }
  };

  const handleEditDebt = async (updatedDebt) => {
    try {
      await axiosInstance.put(`/debts/${currentDebt._id}`, updatedDebt);
      toast.success("Debt updated successfully");
      fetchDebts();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update debt");
    }
  };

  const handleDeleteDebt = async () => {
    try {
      await axiosInstance.delete(`/debts/${currentDebt._id}`);
      toast.success("Debt deleted successfully");
      fetchDebts();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete debt");
    }
  };

  return (
    <div className="relative flex flex-col transition-all duration-300">
      <ToastContainer />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 sm:p-6 bg-neutral-lightBg dark:bg-neutral-darkBg text-neutral-lightText dark:text-neutral-darkText min-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Debts</h1>
          <button
            onClick={() => openModal("add")}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <FaPlus /> Add Debt
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar
            setQuery={setQuery}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or amount"
          />
        </div>

        {/* Table */}
        <div className="bg-neutral-lightCard dark:bg-neutral-darkCard shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-light dark:bg-secondary-dark text-white text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">Date Given</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {debts.length > 0 ? (
                debts.map((debt) => (
                  <tr
                    key={debt._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-2">{debt.personName}</td>
                    <td className="px-4 py-2">{debt.amount}</td>
                    <td className="px-4 py-2">
                      {new Date(debt.dateGiven).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {debt.status === "paid" ? (
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">{debt.notes || "-"}</td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => openModal("edit", debt)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openModal("delete", debt)}
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
                    No debts found.
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

      {/* Modals */}
      {(modalType === "add" || modalType === "edit") && (
        <ModalBox
          title={modalType === "add" ? "Add Debt" : "Edit Debt"}
          onClose={closeModal}
        >
          <DebtForm
            initialData={currentDebt}
            onSubmit={modalType === "add" ? handleAddDebt : handleEditDebt}
            onCancel={closeModal}
          />
        </ModalBox>
      )}

      {modalType === "delete" && (
        <ModalBox title="Confirm Delete" onClose={closeModal}>
          <p className="mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-danger">
              {currentDebt?.personName}
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
              onClick={handleDeleteDebt}
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

/* ----------------------------- Debt Form ----------------------------- */
function DebtForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      personName: "",
       contact: "",
      amount: "",
      dateGiven: "",
      status: "unpaid",
      notes: "",
    }
  );

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.personName.trim()) e.personName = "Name is required.";
    if (!formData.amount) e.amount = "Amount is required.";
    if (!formData.dateGiven) e.dateGiven = "Date is required.";
    if (!formData.contact) e.contact = "Contact Number is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="h-[60vh] overflow-auto p-2">
        <div className="relative mt-3">
          <input
            type="text"
            name="name"
            value={formData.personName}
            onChange={(e) =>
              setFormData({ ...formData, personName: e.target.value })
            }
            placeholder=" "
            className="peer w-full px-3 pt-5 pb-2 border rounded-lg bg-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <label
            htmlFor="name"
            className="absolute left-3 top-2 text-gray-500 text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-primary"
          >
            Person Name
          </label>
          {errors.name && <p className="text-danger text-xs mt-1">{errors.name}</p>}
        </div>

             <div className="relative mt-3">
          <input
            type="text"
            name="mobile"
            value={formData.contact}
            onChange={(e) =>
              setFormData({ ...formData, contact: e.target.value })
            }
            placeholder=" "
            className="peer w-full px-3 pt-5 pb-2 border rounded-lg bg-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <label
            htmlFor="mobile"
            className="absolute left-3 top-2 text-gray-500 text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-primary"
          >
            Contact Number
          </label>
          {errors.contact && (
            <p className="text-danger text-xs mt-1">{errors.contact}</p>
          )}
        </div>

        <div className="relative mt-3">
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder=" "
            className="peer w-full px-3 pt-5 pb-2 border rounded-lg bg-transparent text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <label
            htmlFor="amount"
            className="absolute left-3 top-2 text-gray-500 text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-primary"
          >
            Amount
          </label>
          {errors.amount && (
            <p className="text-danger text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        <div className="relative mt-3">
          <input
            type="date"
            name="dateGiven"
           value={
    formData.dateGiven
      ? new Date(formData.dateGiven).toISOString().split("T")[0]
      : ""
  }
            onChange={(e) =>
              setFormData({ ...formData, dateGiven: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          {errors.dateGiven && (
            <p className="text-danger text-xs mt-1">{errors.dateGiven}</p>
          )}
        </div>

        <div className="relative mt-3">
          <select
            name="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <textarea
          name="notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          placeholder="Notes (optional)"
          rows="3"
          className="w-full px-3 mt-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          {initialData ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
