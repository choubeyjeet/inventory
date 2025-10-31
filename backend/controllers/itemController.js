import Item from "../models/Item.js";

// ➕ Create Item
export const createItem = async (req, res) => {
  try {
  
    const { name, description, category, price, stock, modelNo, gst } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newItem = await Item.create({
      name,
      description,
      category,
      price,
      stock,
      modelNo,
      gst,
      createdBy: req.user.id,
    });

    res.status(201).json({ message: "Item created successfully", item: newItem });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Get All Items with Pagination + Filters
export const getItems = async (req, res) => {
    
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const query = { createdBy: req.user.id };

    if (category) {
      query.category = { $in: category.split(",") };
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const total = await Item.countDocuments(query);
    const items = await Item.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📝 Update Item
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Item.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item updated successfully", item: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ❌ Delete Item
export const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Item.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Get Single Item
export const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, createdBy: req.user.id });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
