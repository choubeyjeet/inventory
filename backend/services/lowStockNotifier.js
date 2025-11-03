// services/lowStockNotifier.js
import Item from "../models/Item.js";
import { sendLowStockSummary } from "../utils/emailService.js";

export const notifyLowStockItems = async () => {
  try {
    const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD || "10", 10);
    const lowStockItems = await Item.find({ stock: { $lt: threshold } });

    if (lowStockItems.length === 0) {
      console.log("✅ No low stock items today.");
      return;
    }

    await sendLowStockSummary(lowStockItems);
  } catch (err) {
    console.error("❌ Error in low stock notification:", err);
  }
};
