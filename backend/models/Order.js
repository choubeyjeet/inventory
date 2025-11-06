import mongoose from "mongoose";
const paymentHistorySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      default: "unknown",
    },
    note: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      name: String,
      email: String,
      phone: String,
      gstNumber: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      pincode: String,
    },
    delivery: {
      address1: String,
      address2: String,
      city: String,
      state: String,
      pincode: String,
    },
    items: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        name: String,
        price: Number,
        quantity: Number,
        gstPercent: Number,
        gstAmount: Number,
        subtotal: Number,
        totalWithGst: Number,
      },
    ],
    totalGST: Number,
    totalAmount: Number,

    // 🆕 Payment Details
    payment: {
      status: {
        type: String,
        enum: ["paid", "partial"],
        default: "paid",
      },
      amountPaid: {
        type: Number,
        default: 0,
        min: 0,
      },
      remainingBalance: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
      paymentHistory: {
      type: [paymentHistorySchema],
      default: [],
    },
  
  },
  
  { timestamps: true }
);



export default mongoose.model("Order", orderSchema);
