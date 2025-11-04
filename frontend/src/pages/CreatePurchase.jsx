import React, { useEffect, useState } from "react";
import { FaCartPlus, FaTrash, FaEdit } from "react-icons/fa";
import axiosInstance from "../utils/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

export default function CreatePurchase() {
  const [orderItems, setOrderItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    gstNumber: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });

  // ✏️ Item Form Fields
  const [itemForm, setItemForm] = useState({
    name: "",
    hsn: "",
    details: "",
    quantity: 1,
    price: "",
    gstPercent: "",
    description: "",
  });

  // --------------------------
  // Handle item add / edit
  // --------------------------
  const handleAddItem = () => {
    const { name, quantity, price, gstPercent } = itemForm;

    if (!name) return toast.error("Enter product name");
    if (!quantity || quantity <= 0) return toast.error("Enter valid quantity");
    if (!price || price <= 0) return toast.error("Enter valid price");

    const subtotal = price * quantity;
    const gstAmount = (subtotal * (gstPercent || 0)) / 100;
    const totalWithGst = subtotal + gstAmount;

    const newItem = { ...itemForm, subtotal, gstAmount, totalWithGst };

    if (editIndex !== null) {
      const updated = [...orderItems];
      updated[editIndex] = newItem;
      setOrderItems(updated);
      setEditIndex(null);
      toast.success("Item updated!");
    } else {
      setOrderItems([...orderItems, newItem]);
      toast.success("Item added!");
    }

    // Reset form
    setItemForm({
      name: "",
      hsn: "",
      details: "",
      quantity: 1,
      price: "",
      gstPercent: "",
      description: "",
    });
  };

  const handleEditItem = (index) => {
    setItemForm(orderItems[index]);
    setEditIndex(index);
  };

  const handleRemoveItem = (index) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const totalGST = orderItems.reduce((sum, i) => sum + i.gstAmount, 0);
  const totalAmount = orderItems.reduce((sum, i) => sum + i.totalWithGst, 0);

  // --------------------------
  // Submit Purchase Order
  // --------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (orderItems.length === 0)
      return toast.error("Add at least one product");

    try {
      setIsLoading(true);
      const payload = {
        supplier,
        items: orderItems,
        totalAmount,
        totalGST,
      };

      if (id) {
        await axiosInstance.put(`/purchases/${id}`, payload);
        toast.success("Purchase updated successfully!");
      } else {
        await axiosInstance.post("/purchases", payload);
        toast.success("Purchase created successfully!");
      }

      setTimeout(() => navigate("/purchase"), 1000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save purchase");
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------
  // Get existing purchase (edit)
  // --------------------------
  const getPurchaseByID = async () => {
    try {
      const res = await axiosInstance.get(`/purchases/${id}`);
      console.log(res.data.order)
      setSupplier(res?.data?.order?.supplier);
      setOrderItems(res?.data?.order?.items);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) getPurchaseByID();
  }, [id]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-900">
      <ToastContainer />
      <h1 className="text-2xl font-semibold mb-6">
        {id ? "Edit Purchase Order" : "Create Purchase Order"}
      </h1>

      {/* Supplier Info */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg mb-3">Supplier Details</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Supplier Name"
            value={supplier.name}
            onChange={(e) =>
              setSupplier({ ...supplier, name: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={supplier.email}
            onChange={(e) =>
              setSupplier({ ...supplier, email: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={supplier.phone}
            onChange={(e) =>
              setSupplier({ ...supplier, phone: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="GST Number"
            value={supplier.gstNumber}
            onChange={(e) =>
              setSupplier({ ...supplier, gstNumber: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        <h3 className="font-semibold mb-2">Address</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Address Line 1"
            value={supplier.address1}
            onChange={(e) =>
              setSupplier({ ...supplier, address1: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Address Line 2"
            value={supplier.address2}
            onChange={(e) =>
              setSupplier({ ...supplier, address2: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="City"
            value={supplier.city}
            onChange={(e) =>
              setSupplier({ ...supplier, city: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="State"
            value={supplier.state}
            onChange={(e) =>
              setSupplier({ ...supplier, state: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={supplier.pincode}
            onChange={(e) =>
              setSupplier({ ...supplier, pincode: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* Item Entry */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg mb-3">
          {editIndex !== null ? "Edit Product" : "Add Product"}
        </h2>

        <div className="grid sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-3">
            <label>Product Name</label>
            <input
              type="text"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm({ ...itemForm, name: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="sm:col-span-2">
            <label>HSN No.</label>
            <input
              type="text"
              value={itemForm.hsn}
              onChange={(e) => setItemForm({ ...itemForm, hsn: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="sm:col-span-3">
            <label>Product Details</label>
            <input
              type="text"
              value={itemForm.details}
              onChange={(e) =>
                setItemForm({ ...itemForm, details: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="sm:col-span-1">
            <label>Qty</label>
            <input
              type="number"
              value={itemForm.quantity}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  quantity: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="sm:col-span-1">
            <label>Price</label>
            <input
              type="number"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm({ ...itemForm, price: Number(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="sm:col-span-1">
            <label>GST %</label>
            <input
              type="number"
              value={itemForm.gstPercent}
              onChange={(e) =>
                setItemForm({
                  ...itemForm,
                  gstPercent: Number(e.target.value),
                })
              }
              className="w-full p-2 border rounded"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              onClick={handleAddItem}
              className={`${
                editIndex !== null
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white rounded-md px-4 py-2 transition`}
            >
              {editIndex !== null ? "Update" : "Add"}
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label>Description</label>
          <textarea
            rows="2"
            value={itemForm.description}
            onChange={(e) =>
              setItemForm({ ...itemForm, description: e.target.value })
            }
            className="w-full p-2 border rounded"
            placeholder="Additional product info..."
          ></textarea>
        </div>
      </div>

      {/* Items Table */}
      {orderItems.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-3">Purchase Summary</h2>
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Product</th>
                <th className="border p-2">HSN</th>
                <th className="border p-2">Qty</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">GST%</th>
                <th className="border p-2">GST Amt</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="border p-2">{item.name}</td>
                  <td className="border p-2">{item.hsn}</td>
                  <td className="border p-2">{item.quantity}</td>
                  <td className="border p-2">₹{item.price}</td>
                  <td className="border p-2">{item.gstPercent}%</td>
                  <td className="border p-2 text-blue-600">
                    ₹{item.gstAmount.toFixed(2)}
                  </td>
                  <td className="border p-2 text-green-600 font-semibold">
                    ₹{item.totalWithGst.toFixed(2)}
                  </td>
                  <td className="border p-2 flex justify-center gap-3">
                    <button
                      onClick={() => handleEditItem(index)}
                      className="text-yellow-600"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-right mt-4 font-semibold text-lg">
            <div>GST Total: ₹{totalGST.toFixed(2)}</div>
            <div>
              Grand Total:{" "}
              <span className="text-blue-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            >
              <FaCartPlus />
              {isLoading
                ? "Saving..."
                : id
                ? "Update Purchase"
                : "Create Purchase"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
