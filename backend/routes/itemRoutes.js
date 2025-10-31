import express from "express";
import {
  createItem,
  getItems,
  updateItem,
  deleteItem,
  getItemById,
} from "../controllers/itemController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// Routes
router.post("/", createItem);
router.get("/", getItems);
router.get("/:id", getItemById);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
