import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  phone: { type: String, trim: true },
  gstNumber: { type: String, trim: true },
  address1: { type: String, trim: true },
  address2: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
});

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  hsn: { type: String, trim: true },
  details: { type: String, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, default: 0 },
  description: { type: String, trim: true },
  subtotal: { type: Number, required: true, min: 0 },
  gstAmount: { type: Number, required: true, min: 0 },
  totalWithGst: { type: Number, required: true, min: 0 },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    supplier: { type: supplierSchema, required: true },
    items: [itemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    totalGST: { type: Number, required: true, min: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);
