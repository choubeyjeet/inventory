import express from "express";
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  deletePurchaseOrder,
  updatePurchaseOrder
} from "../controllers/purchaseOrderController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, createPurchaseOrder);
router.get("/", authMiddleware, getPurchaseOrders);
router.get("/:id", authMiddleware, getPurchaseOrderById);
router.delete("/:id", authMiddleware, deletePurchaseOrder);
router.put("/:id", authMiddleware, updatePurchaseOrder);


export default router;
