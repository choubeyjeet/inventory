import Item from "../models/Item.js";
import Order from "../models/Order.js";
import Debt from "../models/Debt.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Item.countDocuments();
    const totalOrders = await Order.countDocuments();

    // 🧾 Fetch only partially paid orders to calculate total debt
    const partialPayments = await Order.find(
      { "payment.status": "partial" },
      "payment.remainingBalance"
    );

    // Sum remaining balances
    const totalDebtAmount = partialPayments.reduce(
      (sum, order) => sum + (order.payment.remainingBalance || 0),
      0
    );

    // 💰 Calculate total revenue (sum of totalAmount from all orders)
    const orders = await Order.find({}, "totalAmount");
    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    // 🔻 Low stock items
    const lowStockItems = await Item.find({ stock: { $lt: 10 } })
      .select("name stock price")
      .limit(5);

    // 🕒 Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "name email");

    res.json({
      totalProducts,
      totalDebtAmount,
      totalOrders,
      totalRevenue,
      lowStockItems,
      recentOrders,
    });
  } catch (err) {
    console.error("❌ Dashboard fetch error:", err);
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
};
export const getSalesAnalytics = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    let match = {};

    // 🧭 If both month and year provided → specific month
    if (month) {
      const start = new Date(`${year}-${month}-01T00:00:00.000Z`);
      const end = new Date(
        new Date(start).getFullYear(),
        new Date(start).getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      match.createdAt = { $gte: start, $lte: end };
    } else {
      // 🧭 If only year provided → entire year
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      match.createdAt = { $gte: start, $lte: end };
    }

    // 🔢 Group sales data by month
    const salesData = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 🎨 Format response
    const formattedData = salesData.map((d) => ({
      year: d._id.year,
      month: new Date(0, d._id.month - 1).toLocaleString("default", {
        month: "short",
      }),
      totalSales: d.totalSales,
      totalOrders: d.totalOrders,
    }));

    res.json(formattedData);
  } catch (err) {
    console.error("❌ Sales analytics error:", err);
    res.status(500).json({ message: "Failed to load sales analytics" });
  }
};


export const getCategorySalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;
    let match = {};

    // Optional: Filter by date range or year
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      match.createdAt = { $gte: start, $lte: end };
    }

    const categorySales = await Order.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "items", // collection name
          localField: "items.itemId",
          foreignField: "_id",
          as: "itemInfo",
        },
      },
      { $unwind: "$itemInfo" },
      {
        $group: {
          _id: "$itemInfo.category",
          totalSales: {
            $sum: {
              $multiply: ["$items.price", "$items.quantity"],
            },
          },
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);

    const formatted = categorySales.map((cat) => ({
      name: cat._id || "Uncategorized",
      value: cat.totalSales,
      quantity: cat.totalQuantity,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Category sales analytics error:", err);
    res.status(500).json({ message: "Failed to load category sales data" });
  }
};