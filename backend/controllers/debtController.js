import mongoose from "mongoose";
import Debt from "../models/Debt.js";

/* ------------------------------ CREATE DEBT ------------------------------ */
export const createDebt = async (req, res) => {
  try {
    const { personName, amount, status, dateGiven, dueDate, notes, contact } = req.body;
    if (!personName || !amount || !dateGiven || !contact) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const debt = await Debt.create({
      personName,
      amount,
      status,
      dateGiven,
      contact,
      dueDate,
      notes,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "Debt created successfully", debt });
  } catch (error) {
    console.error("Error creating debt:", error);
    res.status(500).json({ message: "Server error while creating debt" });
  }
};

/* ------------------------------- UPDATE DEBT ------------------------------ */
export const updateDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const debt = await Debt.findByIdAndUpdate(id, updates, { new: true });
    if (!debt) return res.status(404).json({ message: "Debt not found" });

    res.json({ message: "Debt updated successfully", debt });
  } catch (error) {
    console.error("Error updating debt:", error);
    res.status(500).json({ message: "Server error while updating debt" });
  }
};

/* ------------------------------- DELETE DEBT ------------------------------ */
export const deleteDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findByIdAndDelete(id);
    if (!debt) return res.status(404).json({ message: "Debt not found" });

    res.json({ message: "Debt deleted successfully" });
  } catch (error) {
    console.error("Error deleting debt:", error);
    res.status(500).json({ message: "Server error while deleting debt" });
  }
};

/* ----------------------------- GET SINGLE DEBT ---------------------------- */
export const getDebtById = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await Debt.findById(id);
    if (!debt) return res.status(404).json({ message: "Debt not found" });

    res.json(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    res.status(500).json({ message: "Server error while fetching debt" });
  }
};


export const getDebt = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const query = {};

    // 🔍 If search term is "paid" or "unpaid", treat it as status filter
    if (["paid", "unpaid"].includes(search.toLowerCase())) {
      query.status = new RegExp(`^${search}$`, "i"); // case-insensitive
    } 
    // 🧭 Otherwise, search across fields
    else if (search) {
      query.$or = [
        { personName: { $regex: search, $options: "i" } },
        { remarks: { $regex: search, $options: "i" } },
      ];
    }

    // 🧮 Pagination setup
    const skip = (page - 1) * limit;

    // 📊 Fetch data
    const total = await Debt.countDocuments(query);
    const debts = await Debt.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      debts,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error("❌ Error fetching debts:", error);
    res.status(500).json({ message: "Server error while fetching debts" });
  }
};
