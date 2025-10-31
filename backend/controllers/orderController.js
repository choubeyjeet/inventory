import Order from "../models/Order.js";
import Item from "../models/Item.js";

// ✅ Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, delivery, items, totalAmount, totalGST } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items in order" });

    // 🧮 Update stock for each item
    for (const i of items) {
      const item = await Item.findById(i.itemId);
      if (!item) return res.status(404).json({ message: `Item ${i.name} not found` });

      if (item.stock < i.quantity)
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${i.name}` });

      item.stock -= i.quantity; // reduce stock
      await item.save();
    }

    // ✅ Create order after stock update
    const order = await Order.create({
      customer,
      delivery,
      items,
      totalAmount,
      totalGST,
    });

    res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get All Orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find order by ID and populate related fields if necessary
    const order = await Order.findById(id)
      .populate("items.product") // if product is referenced in items
      .populate("customer")      // if customer is a reference
      .populate("delivery");     // if delivery details are a reference

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Order (restore stock)
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // ♻️ Restore stock
    for (const i of order.items) {
      const item = await Item.findById(i.itemId);
      if (item) {
        item.stock += i.quantity;
        await item.save();
      }
    }

    await order.deleteOne();
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Order (adjust stock differences)
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, delivery, items, totalAmount, totalGST } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🧠 Map previous quantities
    const prevQuantities = {};
    order.items.forEach((i) => {
      prevQuantities[i.itemId.toString()] = i.quantity;
    });

    // 🧮 Adjust stock for changes
    for (const i of items) {
      const item = await Item.findById(i.itemId);
      if (!item) return res.status(404).json({ message: `Item ${i.name} not found` });

      const prevQty = prevQuantities[i.itemId.toString()] || 0;
      const diff = i.quantity - prevQty;

      if (diff > 0) {
        // Ordered more → decrease stock
        if (item.stock < diff)
          return res.status(400).json({ message: `Insufficient stock for ${i.name}` });
        item.stock -= diff;
      } else if (diff < 0) {
        // Reduced quantity → restore stock
        item.stock += Math.abs(diff);
      }

      await item.save();
    }

    // 🧹 Handle items that were removed completely
    for (const old of order.items) {
      if (!items.find((i) => i.itemId === old.itemId.toString())) {
        const item = await Item.findById(old.itemId);
        if (item) {
          item.stock += old.quantity; // restore old stock
          await item.save();
        }
      }
    }

    // ✅ Update order data
    order.customer = customer || order.customer;
    order.delivery = delivery || order.delivery;
    order.items = items || order.items;
    order.totalAmount = totalAmount || order.totalAmount;
    order.totalGST = totalGST || order.totalGST;
    await order.save();

    res.json({ message: "Order updated successfully", orderId: order._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
