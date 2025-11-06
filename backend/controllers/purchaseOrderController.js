import PurchaseOrder from "../models/PurchaseOrder.js";

// Create Purchase Order
export const createPurchaseOrder = async (req, res) => {
  try {
    const { supplier, items, totalAmount, totalGST } = req.body;

    if (!supplier || !items || items.length === 0)
      return res.status(400).json({ message: "Missing supplier or items" });

    const purchase = await PurchaseOrder.create({
      supplier,
      items,
      totalAmount,
      totalGST,
      createdBy: req.user.id, // assuming auth middleware sets req.user
    });

    res.status(201).json({ success: true, purchase });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Get All Purchase Orders (with pagination, search, date filters)
export const getPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", fromDate, toDate } = req.query;

    const query = {};

    // Search by supplier name, email, or item name
    if (search) {
      query.$or = [
        { "supplier.name": { $regex: search, $options: "i" } },
        { "supplier.email": { $regex: search, $options: "i" } },
        { "items.name": { $regex: search, $options: "i" } },
      ];
    }

    // Date filter (createdAt)
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const totalOrders = await PurchaseOrder.countDocuments(query);
    const orders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get Single Purchase Order
export const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Purchase Order
export const deletePurchaseOrder = async (req, res) => {
  try {
    const deleted = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Purchase Order not found" });
    res.json({ success: true, message: "Purchase Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePurchaseOrder = async (req, res) => {
  try {
    const { supplier, items, totalAmount, totalGST } = req.body;

    if (!supplier || !items || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Missing supplier or items" });
    }

    const updatedPurchase = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      {
        supplier,
        items,
        totalAmount,
        totalGST,
        updatedBy: req.user?.id || null, // optional tracking
      },
      { new: true, runValidators: true }
    );

    if (!updatedPurchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Purchase Order updated successfully",
      purchase: updatedPurchase,
    });
  } catch (err) {
    console.error("❌ updatePurchaseOrder error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
