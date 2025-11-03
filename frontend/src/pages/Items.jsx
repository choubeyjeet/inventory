import React, { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaFilter } from "react-icons/fa";
import Select from "react-select";
import axiosInstance from "../utils/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import categories from "../data/categories";
import SearchBar from "../components/SearchBar";
import ModalBox from "../utils/ModalBox";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [modalType, setModalType] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Fetch items
  const fetchItems = async () => {
    try {
      const params = { page, limit };
      if (selectedCategories.length > 0) {
        params.category = selectedCategories.join(",");
      }
      if (debouncedQuery) params.search = debouncedQuery;

      const res = await axiosInstance.get("/items", { params });
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch items");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, selectedCategories, debouncedQuery]);

  // Category filter
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Modal controls
  const openModal = (type, item = null) => {
    setModalType(type);
    setCurrentItem(item);
  };
  const closeModal = () => {
    setModalType(null);
    setCurrentItem(null);
  };

  // CRUD
  const handleAddItem = async (newItem) => {
    try {
      await axiosInstance.post("/items", newItem);
      toast.success("Item added successfully");
      fetchItems();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add item");
    }
  };

  const handleEditItem = async (updatedItem) => {
    try {
      await axiosInstance.put(`/items/${currentItem._id}`, updatedItem);
      toast.success("Item updated successfully");
      fetchItems();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update item");
    }
  };

  const handleDeleteItem = async () => {
    try {
      await axiosInstance.delete(`/items/${currentItem._id}`);
      toast.success("Item deleted successfully");
      fetchItems();
      closeModal();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete item");
    }
  };

  return (
    <div className="relative flex flex-col transition-all duration-300">
      <ToastContainer />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 sm:p-6 bg-neutral-lightBg dark:bg-neutral-darkBg text-neutral-lightText dark:text-neutral-darkText min-h-screen transition-colors duration-300">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-center sm:text-left">
            Inventory Items
          </h1>

          <div className="flex flex-wrap justify-center sm:justify-end gap-3">
            <button
              onClick={() => openModal("add")}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm sm:text-base rounded-lg bg-primary text-white hover:bg-primary-dark transition"
            >
              <FaPlus /> Add Item
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-secondary-light/10"
            >
              <FaFilter size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar
           setQuery={setQuery}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items..."
          />
        </div>

        {/* Table (scrollable on mobile) */}
        <div className="bg-neutral-lightCard dark:bg-neutral-darkCard shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary-light dark:bg-secondary-dark text-white text-left">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Name</th>
                <th className="px-4 py-3 whitespace-nowrap">HSN No.</th>
                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                <th className="px-4 py-3 whitespace-nowrap">Price</th>
                 <th className="px-4 py-3 whitespace-nowrap">GST%</th>
                <th className="px-4 py-3 whitespace-nowrap">Stock</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Actions</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-2">{item.name}</td>
                    <td className="px-4 py-2">{item.modelNo || "-"}</td>
                    <td className="px-4 py-2">{item.category}</td>
                    <td className="px-4 py-2">{item.price}</td>
                     <td className="px-4 py-2">{item.gst}</td>
                    <td className="px-4 py-2">{item.stock}</td>
                    <td className="px-4 py-2 text-center space-x-2">
                      <button
                        onClick={() => openModal("edit", item)}
                        className="text-primary hover:text-primary-dark"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openModal("delete", item)}
                        className="text-danger hover:text-danger-dark"
                      >
                        <FaTrash />
                      </button>
                    </td>
                   <td className="px-4 py-2 text-center">
  {item.stock === 0 ? (
    <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
      Out of Stock
    </span>
  ) : item.stock <= 5 ? (
    <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-yellow-500 rounded-full">
      Low Stock
    </span>
  ) : (
    <span className="inline-block px-3 py-1 text-xs font-semibold text-white bg-green-500 rounded-full">
      Available
    </span>
  )}
</td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center py-6 text-gray-500 dark:text-gray-400"
                  >
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap justify-center items-center gap-3 mt-6 text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary text-white rounded-lg disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-secondary text-white rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* FILTER DRAWER */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-neutral-lightCard dark:bg-neutral-darkCard shadow-lg border-l border-secondary-light dark:border-secondary-dark transform transition-transform duration-300 ease-in-out z-50 ${
          showFilter ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={() => setShowFilter(false)}
            className="text-secondary hover:text-danger text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-4rem)]">
          <h3 className="text-sm font-medium mb-2">Categories</h3>
          {categories.map((cat) => {
            const active = selectedCategories.includes(cat.label);
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryChange(cat.label)}
                className={`block w-full text-left px-3 py-2 rounded-lg border mb-2 transition-colors ${
                  active
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      {(modalType === "add" || modalType === "edit") && (
        <ModalBox
          title={modalType === "add" ? "Add Item" : "Edit Item"}
          onClose={closeModal}
        >
          <ItemForm
            initialData={currentItem}
            onSubmit={modalType === "add" ? handleAddItem : handleEditItem}
            onCancel={closeModal}
          />
        </ModalBox>
      )}
      {modalType === "delete" && (
        <ModalBox title="Confirm Delete" onClose={closeModal}>
          <p className="mb-4">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-danger">
              {currentItem?.name}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-secondary-dark transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              className="px-4 py-2 rounded-lg bg-danger text-white hover:bg-danger-dark transition"
            >
              Delete
            </button>
          </div>
        </ModalBox>
      )}
    </div>
  );
}

/* ----------------------------- Modal ----------------------------- */

/* ----------------------------- Item Form ----------------------------- */
function ItemForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      modelNo: "",
      category: "",
      price: "",
      stock: "",
      description: "",
    }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = "Item name is required.";
    if (!formData.category) e.category = "Please select a category.";
    if (!formData.price) e.price = "Price is required.";
    if (!formData.stock) e.stock = "Stock is required.";
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
        {[
        { name: "name", placeholder: "Item name", type: "text" },
        { name: "modelNo", placeholder: "HSN No.", type: "text" },
        { name: "price", placeholder: "Price", type: "number" },
         { name: "gst", placeholder: "GST", type: "number" },
        { name: "stock", placeholder: "Stock Quantity", type: "number" },
      ].map((input) => (
      <div key={input.name} className="relative w-full mt-3">
      <input
        type={input.type}
        name={input.name}
        value={formData[input.name]}
        onChange={(e) =>
          setFormData({ ...formData, [input.name]: e.target.value })
        }
        className={`peer w-full px-3 pt-5 pb-2 border rounded-lg bg-transparent text-sm sm:text-base text-gray-900 focus:ring-2 focus:ring-primary outline-none ${
          errors[input.name] ? "border-danger" : "border-gray-300"
        }`}
        placeholder=" " // important: keep placeholder as single space
      />
      <label
        htmlFor={input.name}
        className={`absolute left-3 top-2 text-gray-500 text-sm transition-all duration-200
          peer-placeholder-shown:top-3.5 
          peer-placeholder-shown:text-gray-400 
          peer-placeholder-shown:text-base 
          peer-focus:top-1 
          peer-focus:text-primary 
          peer-focus:text-sm
        `}
      >
        {input.placeholder}
      </label>

      {errors[input.name] && (
        <p className="text-danger italic text-xs sm:text-sm mt-1">
          {errors[input.name]}
        </p>
      )}
    </div>
      ))}

      <Select
      className="mt-3"
        options={categories}
        value={categories.find((c) => c.value === formData.category) || null}
        onChange={(opt) =>
          setFormData((f) => ({ ...f, category: opt ? opt.value : "" }))
        }
        placeholder="Select category"
        isClearable
      />
      {errors.category && (
        <p className="text-danger italic text-xs sm:text-sm mt-1">
          {errors.category}
        </p>
      )}

      <textarea
      
        name="description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder="Description (optional)"
        rows="3"
        className="w-full px-3 mt-3 py-2 border rounded-lg bg-transparent focus:ring-2 focus:ring-primary outline-none resize-none text-sm sm:text-base"
      />
      </div>

      <div className="flex justify-end flex-wrap gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm sm:text-base bg-secondary text-white rounded-lg hover:bg-secondary-dark transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm sm:text-base bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          {initialData ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
