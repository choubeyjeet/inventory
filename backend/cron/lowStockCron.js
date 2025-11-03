// cron/lowStockCron.js
import cron from "node-cron";
import { notifyLowStockItems } from "../services/lowStockNotifier.js";

// 🕘 Run every day at 9:00 AM
cron.schedule("0 9 * * *", async () => {
  console.log("⏰ Running daily low stock check at 12:18 PM...");
  await notifyLowStockItems();
});

console.log("✅ Low stock cron job scheduled at 9:00 AM daily");
