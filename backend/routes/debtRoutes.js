import express from "express";
import {
  createDebt,
  updateDebt,
  deleteDebt,
  getDebtById,
  getDebt,
} from "../controllers/debtController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
// Protect all routes
router.use(authMiddleware);

router.post("/", createDebt);
router.get("/", getDebt);
router.get("/:id", getDebtById);
router.put("/:id", updateDebt);
router.delete("/:id", deleteDebt);

export default router;
