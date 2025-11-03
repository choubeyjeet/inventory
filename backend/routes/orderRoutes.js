import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  deleteOrder,
  updateOrder,
  downloadAsPDF, // ✅ make sure this exists in your controller
} from "../controllers/orderController.js";

const router = express.Router();

// Create order
router.post("/", createOrder);

// Get all orders (with pagination & search support)
router.get("/", getOrders);

// Get order by ID
router.get("/:id", getOrderById);

// Update order by ID
router.put("/:id", updateOrder);

// Delete order by ID
router.delete("/:id", deleteOrder);

// ✅ Download order as PDF
router.get("/:id/download", downloadAsPDF);

export default router;
