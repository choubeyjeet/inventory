import express from "express";
import {
  getDashboardStats,
  getSalesAnalytics,
  getCategorySalesAnalytics
  
} from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Routes
router.get("/stats", getDashboardStats);
router.get("/sales", getSalesAnalytics);
router.get("/product-category", getCategorySalesAnalytics);

export default router;
