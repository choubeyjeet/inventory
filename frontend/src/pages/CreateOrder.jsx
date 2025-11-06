import React, { useEffect, useState } from "react";
import { FaCartPlus, FaTrash, FaEdit } from "react-icons/fa";
import Select from "react-select";
import axiosInstance from "../utils/axiosInstance";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateOrder() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editIndex, setEditIndex] = useState(null); 
  const [paymentStatus, setPaymentStatus] = useState("fully"); 
  const [paymentAmountPaid, setPaymentAmountPaid] = useState(0); 
  const [paymentDate, setPaymentDate] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [existingPaymentHistory, setExistingPaymentHistory] = useState([]);
  
  const {id} = useParams(); 
  const navigate =  useNavigate()

  const [customer, setCustomer] = useState({
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

  const [delivery, setDelivery] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
  });

const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/items?limit=10000");
        setProducts(
          res.data.items.map((item) => ({
            value: item._id,
            label: `${item.name} — ₹${item.price}`,
            ...item,
          }))
        );
      } catch (err) {
        toast.error("Failed to fetch products");
      }
    };
  useEffect(() => {
    
    fetchProducts();
  }, []);

  // --------------------------
  // Copy Billing to Delivery
  // --------------------------
  const copyBillingToDelivery = () => {
    setDelivery({
      address1: customer.address1,
      address2: customer.address2,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
    });
  };

  // --------------------------
  // Add or Update Product
  // --------------------------




  const handleAddItem = () => {
    if (!selectedProduct) return toast.error("Select a product");
    const product = selectedProduct;
    const gstPercent = product.gst || 18; // default 18%
    const subtotal = product.price * quantity;
    const gstAmount = (subtotal * gstPercent) / 100;
    const totalWithGst = subtotal + gstAmount;

    const newItem = {
      itemId: product._id,
      name: product.name,
      price: product.price,
      quantity,
      gstPercent,
      gstAmount,
      subtotal,
      totalWithGst,
    };

    if (editIndex !== null) {
      // Update existing item
      const updatedItems = [...orderItems];
      updatedItems[editIndex] = newItem;
      setOrderItems(updatedItems);
      setEditIndex(null);
      
    } else {
      // Add new item
      const existingItem = orderItems.find((i) => i.itemId === product._id);
      if (existingItem) return toast.error("Item already added");
      setOrderItems([...orderItems, newItem]);
     
    }

    setSelectedProduct(null);
    setQuantity(1);
  };

  // --------------------------
  // Edit Item
  // --------------------------
  const handleEditItem = (index) => {
    const item = orderItems[index];
    const selected = products.find((p) => p._id === item.itemId);
    setSelectedProduct(selected);
    setQuantity(item.quantity);
    setEditIndex(index);
  };

  // --------------------------
  // Remove item
  // --------------------------
  const handleRemoveItem = (id) =>
    setOrderItems(orderItems?.filter((i) => i.itemId !== id));

  // --------------------------
  // Totals
  // --------------------------
  const totalAmount = orderItems?.reduce((sum, i) => sum + i.totalWithGst, 0);
  const totalGST = orderItems?.reduce((sum, i) => sum + i.gstAmount, 0);

  // --------------------------
  // Submit Order
  // --------------------------
const handleSubmit = async (e) => {
  e?.preventDefault();

  if (orderItems?.length === 0) return toast.error("Add at least one item");
  if (!customer.name || !customer.email)
    return toast.error("Fill customer info");

  // ✅ Payment validations
  if (paymentStatus === "partial") {
    if (!paymentAmountPaid || Number(paymentAmountPaid) <= 0) {
      return toast.error("Enter a valid paid amount");
    }

    if (Number(paymentAmountPaid) > totalAmount) {
      return toast.error("Paid amount cannot exceed total amount");
    }
  }

  if (!paymentDate) {
    return toast.error("Please select a payment date");
  }

  const amountPaid = paymentStatus === "fully" ? totalAmount : Number(paymentAmountPaid);
  const remainingBalance = totalAmount - amountPaid;

  // Build payment history entry
  const newPaymentHistoryEntry = {
    amount: amountPaid,
    date: paymentDate,
    method: "online", // example value; can be dynamic if needed
    note: paymentStatus === "fully" ? "Full payment" : "Partial payment",
  };

  try {
    setIsLoading(true);

    const payload = {
      customer,
      delivery,
      items: orderItems,
      totalAmount,
      totalGST,
      payment: {
        status: paymentStatus === "fully" ? "paid" : "partial",
        amountPaid,
        remainingBalance,
        date: paymentDate,
      },
      paymentHistory: id
        ? [...(existingPaymentHistory || []), newPaymentHistoryEntry]
        : [newPaymentHistoryEntry],
    };

    if (id) {
      // ✅ Update existing order
      await axiosInstance.put(`/orders/${id}`, payload);
      toast.success("Order updated successfully!");
    } else {
      // ✅ Create new order
      await axiosInstance.post("/orders", payload);
      toast.success("Order created successfully!");
      setExistingPaymentHistory([]); // ✅ Reset history only for new order form
    }

    // ✅ Reset form (keeps history intact if editing)
    setOrderItems([]);
    setCustomer({
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
    setDelivery({
      address1: "",
      address2: "",
      city: "",
      state: "",
      pincode: "",
    });
    setPaymentStatus("fully");
    setPaymentAmountPaid(0);
    setPaymentDate("");

    setTimeout(() => {
      navigate("/sales");
    }, 1000);
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed to save order");
  } finally {
    setIsLoading(false);
  }
};




const getOrderByID = async () => {
  try {
    const response = await axiosInstance.get(`/orders/${id}`);
    const data = response?.data;

    if (!data) throw new Error("Order data not found");

    // Populate basic fields
    setOrderItems(data.items || []);
    setCustomer(data.customer || {});
    setDelivery(data.delivery || {});

    // Handle payment state
    if (data.payment) {
      setPaymentStatus(data.payment.status === "paid" ? "fully" : "partial");
      setPaymentAmountPaid(data.payment.amountPaid || 0);
      setPaymentDate(
        data.payment.date
          ? new Date(data.payment.date).toISOString().split("T")[0]
          : ""
      );
    } else {
      // Default: assume fully paid if no payment field is present
      setPaymentStatus("fully");
      setPaymentAmountPaid(data.totalAmount || 0);
      setPaymentDate(""); // no date
    }

    // Handle payment history (if applicable)
    if (data.paymentHistory && Array.isArray(data.paymentHistory)) {
      setPaymentHistory(data.paymentHistory);
      setExistingPaymentHistory(data.paymentHistory)
    } else {
      setPaymentHistory([]); // no history
    }
  } catch (error) {
    console.error("Error fetching order:", error);
    toast.error("Failed to fetch order details");
  }
};



useEffect(()=>{
if(id){
  getOrderByID();
}
}, [id])

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-900">
        <ToastContainer />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold">{id ? "Edit" : "Create"} Order</h1>
      </div>

      {/* ✅ Customer Info (unchanged) */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="font-semibold text-lg mb-3">Customer Details</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="email"
            placeholder="Email"
            value={customer.email}
            onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Phone"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
            className="border p-2 rounded"
          />
           
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="GST Number (optional)"
            value={customer.gstNumber}
            onChange={(e) =>
              setCustomer({ ...customer, gstNumber: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>

        <h3 className="font-semibold text-md mb-2">Billing Address</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-2">
          <input
            type="text"
            placeholder="Address Line 1"
            value={customer.address1}
            onChange={(e) =>
              setCustomer({ ...customer, address1: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Address Line 2"
            value={customer.address2}
            onChange={(e) =>
              setCustomer({ ...customer, address2: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="City"
            value={customer.city}
            onChange={(e) =>
              setCustomer({ ...customer, city: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="State"
            value={customer.state}
            onChange={(e) =>
              setCustomer({ ...customer, state: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={customer.pincode}
            onChange={(e) =>
              setCustomer({ ...customer, pincode: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* ✅ Delivery Info (unchanged) */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Delivery Address</h2>
          <button
            onClick={copyBillingToDelivery}
            className="text-blue-600 hover:underline text-sm"
          >
            Copy from Billing
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Address Line 1"
            value={delivery.address1}
            onChange={(e) =>
              setDelivery({ ...delivery, address1: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Address Line 2"
            value={delivery.address2}
            onChange={(e) =>
              setDelivery({ ...delivery, address2: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="City"
            value={delivery.city}
            onChange={(e) =>
              setDelivery({ ...delivery, city: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="State"
            value={delivery.state}
            onChange={(e) =>
              setDelivery({ ...delivery, state: e.target.value })
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={delivery.pincode}
            onChange={(e) =>
              setDelivery({ ...delivery, pincode: e.target.value })
            }
            className="border p-2 rounded"
          />
        </div>
      </div>

      {/* ✅ Add Items (same UI, now supports editing) */}
<div className="bg-white p-4 rounded-lg shadow mb-6">
  <h2 className="font-semibold text-lg mb-3">
    {editIndex !== null ? "Edit Item" : "Add Items"}
  </h2>

  <div className="grid sm:grid-cols-12 gap-4 items-end">
    {/* 🟢 Product Select */}
    <div className="sm:col-span-5">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        Product
      </label>
      <Select
        value={selectedProduct}
        onChange={(value) => {
          setSelectedProduct(value);
          setQuantity(1);
        }}
        options={products}
        placeholder="Search & Select Product..."
        className="w-full"
      />
    </div>

    {/* 🔸 Quantity */}
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        Quantity
      </label>
      <input
        type="number"
        min="1"
        max={selectedProduct?.stock || 1}
        value={quantity}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (selectedProduct && val > selectedProduct.stock) {
            alert(`Only ${selectedProduct.stock} in stock`);
            setQuantity(selectedProduct.stock);
          } else {
            setQuantity(val);
          }
        }}
        className="border p-2 rounded w-full"
        placeholder="Qty"
        disabled={!selectedProduct}
      />
    </div>

    {/* 🔹 Available Stock */}
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        Available Stock
      </label>
      <input
        type="number"
        readOnly
        value={selectedProduct?.stock ?? ""}
        className="border p-2 rounded bg-gray-100 text-gray-700 w-full"
        placeholder="Stock"
      />
    </div>

    {/* 🔸 GST */}
    <div className="sm:col-span-2">
      <label className="block text-sm font-medium mb-1 text-gray-700">
        GST %
      </label>
      <input
        type="number"
        readOnly
        value={selectedProduct?.gst ?? ""}
        className="border p-2 rounded bg-gray-100 text-gray-700 w-full"
        placeholder="GST"
      />
    </div>

    {/* 🟢 Add / Update Button */}
    <div className="sm:col-span-1 flex flex-col justify-end">
      <label className="block text-sm font-medium mb-1 text-transparent select-none">
        &nbsp;
      </label>
      <button
        onClick={handleAddItem}
        disabled={!selectedProduct}
        className={`${
          editIndex !== null
            ? "bg-yellow-600 hover:bg-yellow-700"
            : "bg-green-600 hover:bg-green-700"
        } text-white rounded-md px-4 py-2 transition disabled:opacity-50 w-full`}
      >
        {editIndex !== null ? "Update" : "Add"}
      </button>
    </div>
  </div>
</div>



      {/* ✅ Items Table + Generate Button */}
      {orderItems.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold text-lg mb-3">Order Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Product</th>
                  <th className="border p-2">Price</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">GST %</th>
                  <th className="border p-2">GST Amt</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, index) => (
                  <tr key={item.itemId} className="text-center">
                    <td className="border p-2">{item.name}</td>
                    <td className="border p-2">₹{item.price}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">{item.gstPercent}%</td>
                    <td className="border p-2 text-blue-600">
                      ₹{item.gstAmount.toFixed(2)}
                    </td>
                    <td className="border p-2 font-semibold text-green-600">
                      ₹{item.totalWithGst.toFixed(2)}
                    </td>
                    <td className="border p-2 flex justify-center gap-3">
                      <button
                        onClick={() => handleEditItem(index)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.itemId)}
                        className="text-red-600 hover:text-red-800"
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
                <span className="text-blue-600">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* ✅ Generate Order Button */}
           <div className="flex justify-between mt-6 items-center">
<div className="space-y-4">
  <p className="font-medium">Payment Status:</p>

  {/* Radio buttons */}
  <div className="flex items-center gap-6">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="payment"
        value="fully_paid"
        checked={paymentStatus === "fully"}
        onChange={() => {
          setPaymentStatus("fully");
          setPaymentAmountPaid(totalAmount);
          setPaymentDate(new Date().toISOString().split("T")[0]);
        }}
        className="w-4 h-4"
      />
      <span>Fully Paid</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="payment"
        value="partially_paid"
        checked={paymentStatus === "partial"}
        onChange={() => {
          setPaymentStatus("partial");
          setPaymentAmountPaid("");
          setPaymentDate("");
        }}
        className="w-4 h-4"
      />
      <span>Partially Paid</span>
    </label>
  </div>

  {/* Payment fields */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Amount Paid */}
    <div>
      <label className="block mb-1 font-medium">Amount Paid:</label>
      <input
        type="number"
        readOnly={paymentStatus === "fully"}
        value={
          paymentStatus === "fully" ? totalAmount.toFixed(2) : paymentAmountPaid
        }
        onChange={(e) => setPaymentAmountPaid(e.target.value)}
        className="border rounded h-[40px] p-2 w-full"
        placeholder="Enter amount paid"
      />
    </div>

    {/* Remaining Balance */}
    {paymentStatus === "partial" && (
      <div>
        <label className="block mb-1 font-medium">Remaining Balance:</label>
        <input
          type="text"
          value={(totalAmount - Number(paymentAmountPaid || 0)).toFixed(2)}
          readOnly
          className="border rounded h-[40px] p-2 w-full bg-gray-100"
        />
      </div>
    )}

    {/* Payment Date */}
    <div>
      <label className="block mb-1 font-medium">Payment Date:</label>
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        className="border rounded h-[40px] p-2 w-full"
      />
    </div>
  </div>

  {/* 🔄 Payment History Section */}
  {paymentHistory?.length > 0 && (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Payment History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-300 rounded-md overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Amount</th>
              <th className="px-4 py-2 text-left">Method</th>
              <th className="px-4 py-2 text-left">Note</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment, index) => (
              <tr
                key={index}
                className="even:bg-gray-50 dark:even:bg-gray-700 odd:bg-white dark:odd:bg-gray-800"
              >
                <td className="px-4 py-2">{new Date(payment.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">₹{payment.amount.toFixed(2)}</td>
                <td className="px-4 py-2">{payment.method || "N/A"}</td>
                <td className="px-4 py-2">{payment.note || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )}
</div>



  <button
    onClick={handleSubmit}
    disabled={isLoading}
    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
  >
    <FaCartPlus />
    {isLoading ? "Generating..." : id ? "Update Order" : "Generate Order"}
  </button>
</div>

          </div>
        </div>
      )}
    </div>
  );
}
