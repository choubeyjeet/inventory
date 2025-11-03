import mongoose from "mongoose"; 
import Order from "../models/Order.js";
import Item from "../models/Item.js";
import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import streamBuffers from "stream-buffers";

// ✅ Create Order
export const createOrder = async (req, res) => {
  try {
    const { customer, delivery, items, totalAmount, totalGST } = req.body;

    if (!items || items.length === 0)
      return res.status(400).json({ message: "No items in order" });

    // 🧮 Update stock for each item
    for (const i of items) {
      const item = await Item.findById(i.itemId);
      if (!item)
        return res.status(404).json({ message: `Item ${i.name} not found` });

      if (item.stock < i.quantity)
        return res
          .status(400)
          .json({ message: `Insufficient stock for ${i.name}` });

      item.stock -= i.quantity;
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

    // 📄 Generate PDF in-memory (no file saved)
    const pdfBuffer = await generateInvoicePDF(order);

    // 📧 Send email with PDF
    if (customer?.email) {
      await sendOrderEmail(customer, order, pdfBuffer);
    }

    res.status(201).json({
      message: "Order created successfully and email sent",
      orderId: order._id,
    });
  } catch (err) {
    console.error("❌ createOrder error:", err);
    res.status(500).json({ message: err.message });
  }
};



export const generateInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const stream = new streamBuffers.WritableStreamBuffer({
        initialSize: 1024 * 1024, // 1MB
        incrementAmount: 512 * 1024, // Grow by 512KB chunks
      });

      // Pipe PDF data into the memory buffer
      doc.pipe(stream);

      const primaryColor = "#f02828";
      const textColor = "#000000";

      // ========== HEADER ==========
      const leftX = 40;
      const rightX = 330;
      const topY = 40;

      doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(20).text("Kihaan Enterprises", leftX, topY);

      doc
        .fillColor(textColor)
        .font("Helvetica")
        .fontSize(10)
        .text("Prem Complex, 27 B, Haridwar Rd,", leftX, topY + 25)
        .text("Dehradun, Uttarakhand 248001", leftX)
        .text("Phone: 8447594486", leftX)
        .text("GSTIN: 05ATTPN0666K1Z5", leftX)
        .text("PAN: 05ATTPN0666K1Z5", leftX);

      doc.font("Helvetica-Bold").fontSize(12).text("TAX INVOICE", rightX, topY);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(`Invoice No: ${order._id}`, rightX)
        .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightX)
        .text(`Email: choubeyjeet2580@gmail.com`, rightX)
        .text(`Website: www.kihaanenterprises.com`, rightX);

      doc.moveTo(40, 130).lineTo(550, 130).stroke();

      // ========== BILL TO / SHIP TO ==========
      const billToX = 40;
      const shipToX = 330;
      const sectionY = 140;

      doc.font("Helvetica-Bold").fontSize(12).text("BILL TO", billToX, sectionY);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(order.customer?.name || "N/A", billToX, sectionY + 15)
        .text(order.customer?.email || "N/A", billToX)
        .text(order.customer?.address1 || "", billToX)
        .text(`${order.customer?.city || ""}, ${order.customer?.state || ""}`, billToX);

      doc.font("Helvetica-Bold").fontSize(12).text("SHIP TO", shipToX, sectionY);
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(order.delivery?.address1 || "N/A", shipToX, sectionY + 15)
        .text(order.delivery?.address2 || "N/A", shipToX)
        .text(order.delivery?.city || "", shipToX)
        .text(`${order.delivery?.state || ""}, ${order.delivery?.pincode || ""}`, shipToX);

      doc.moveTo(40, 220).lineTo(550, 220).stroke();

      // ========== ITEMS TABLE ==========
      const tableTop = 230;
      const columnWidths = [30, 120, 70, 60, 60, 60, 80];
      const headers = ["S.No", "Item", "HSN No.", "Qty", "Rate", "Tax%", "Amount"];

      doc.rect(40, tableTop, 510, 20).fill(primaryColor).fillColor("white");
      doc.font("Helvetica").fontSize(10);

      let x = 40;
      headers.forEach((h, i) => {
        doc.text(h, x + 5, tableTop + 5, { width: columnWidths[i], align: "left" });
        x += columnWidths[i];
      });
      doc.fillColor(textColor);

      let y = tableTop + 25;
      order.items.forEach((item, idx) => {
        const row = [
          idx + 1,
          item.name,
          item.model || "-",
          item.quantity,
          `₹${item.price.toFixed(2)}`,
          `${item.gstPercent}%`,
          `₹${item.totalWithGst.toFixed(2)}`,
        ];

        let x = 40;
        row.forEach((r, i) => {
          doc.text(String(r), x + 5, y, { width: columnWidths[i], align: "left" });
          x += columnWidths[i];
        });
        y += 20;
      });

      doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke();

      // ========== TOTALS ==========
      y += 15;
      doc.font("Helvetica-Bold").fontSize(10);
      doc.text(`Subtotal: ₹${order.subtotal?.toFixed(2) || "0.00"}`, 400, y);
      y += 15;
      doc.text(`Total GST: ₹${order.totalGST?.toFixed(2) || "0.00"}`, 400, y);
      y += 15;
      doc.text(`Discount: ₹${order.discount?.toFixed(2) || "0.00"}`, 400, y);
      y += 15;
      doc.text(`Grand Total: ₹${order.totalAmount?.toFixed(2) || "0.00"}`, 400, y);

      doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke();

      // ========== TERMS & BANK DETAILS ==========
      y += 30;
      doc.font("Helvetica-Bold").fontSize(10).text("Terms & Conditions", 40, y);
      doc.font("Helvetica").fontSize(9);
      doc.text("1. Customer will pay the GST", 40, y + 15);
      doc.text("2. Customer will pay the Delivery charges", 40, y + 30);
      doc.text("3. Pay due amount within 15 days", 40, y + 45);

      const bankY = y;
      doc.font("Helvetica-Bold").fontSize(10).text("Bank Details", 250, bankY);
      doc.font("Helvetica").fontSize(9);
      doc.text("Account Holder: Kihaan Enterprises", 250, bankY + 15);
      doc.text("Account No: 123456789", 250, bankY + 30);
      doc.text("Bank: SBI, Branch: Dehradun", 250, bankY + 45);
      doc.text("IFSC: SBIN0004567", 250, bankY + 60);
      doc.text("UPI: kihaan@upi", 250, bankY + 75);

      doc.font("Helvetica-Oblique").fontSize(9).text("Authorized Signatory For Kihaan Enterprises", 400, bankY + 95);

      doc.moveDown(3);
      doc.font("Helvetica-Oblique").fontSize(9).fillColor("gray").text("Thank you for your business!", { align: "center" });

      // ✅ Important: close document properly
      doc.end();

      // ✅ Wait for PDF data to fully flush before resolving
      stream.on("finish", () => {
        try {
          const buffer = stream.getContents();
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      });

      // ✅ Catch any stream error (Render-safe)
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
};


const sendOrderEmail = async (customer, order, pdfBuffer) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // app password
    },
  });

  const mailOptions = {
    from: `"Kihaan Enterprises" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Order Confirmation - Invoice #${order._id}`,
    text: `Hello ${customer.name},\n\nThank you for your order!\nYour total is ₹${order.totalAmount}.\n\nPlease find your invoice attached.`,
    attachments: [
      {
        filename: `Invoice_${order._id}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};




// ✅ Get All Orders
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", fromDate, toDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    // Optional: filter by logged-in user
    if (req.user?.id) {
      query.createdBy = req.user.id;
    }

    // 🔍 Search by ID or customer fields
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query._id = search;
      } else {
        query.$or = [
          { "customer.name": { $regex: search, $options: "i" } },
          { "customer.email": { $regex: search, $options: "i" } },
          { "customer.phone": { $regex: search, $options: "i" } },
        ];
      }
    }

    // 📅 Date filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        // Include the entire "toDate" day by setting time to end of day
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endOfDay;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      limit: parseInt(limit),
      filters: { search, fromDate, toDate },
      orders,
    });
  } catch (err) {
    console.error("❌ Error fetching orders:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

   
    const order = await Order.findById(id)
     

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




export const downloadAsPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
  
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Setup PDF
    const doc = new PDFDocument({ margin: 40 });
    const fileName = `Invoice_${order._id}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Colors
    const primaryColor = "#f02828"; // red
    const textColor = "#000000";

    // ========== HEADER ==========
    const leftX = 40;
    const rightX = 330;
    const topY = 40;

    // Company Info (Left)
    doc
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Kihaan Enterprises", leftX, topY);

    doc
      .fillColor(textColor)
      .font("Helvetica")
      .fontSize(10)
      .text("Prem Complex, 27 B, Haridwar Rd,", leftX, topY + 25)
      .text("Dehradun, Uttarakhand 248001", leftX)
      .text("Phone: 8447594486", leftX)
      .text("GSTIN: 05ATTPN0666K1Z5", leftX)
      .text("PAN: 05ATTPN0666K1Z5", leftX);

    // Invoice Info (Right)
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("TAX INVOICE", rightX, topY);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Invoice No: ${order._id}`, rightX)
      .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightX)
      .text(`Email: choubeyjeet2580@gmail.com`, rightX)
      .text(`Website: www.kihaanenterprises.com`, rightX);

    // Divider line
    doc.moveTo(40, 130).lineTo(550, 130).stroke();

    // ========== BILL TO / SHIP TO ==========
    const billToX = 40;
    const shipToX = 330;
    const sectionY = 140;

    // Bill To
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("BILL TO", billToX, sectionY);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(order.customer?.name || "N/A", billToX, sectionY + 15)
      .text(order.customer?.email || "N/A", billToX)
      .text(order.customer?.address1 || "", billToX)
      .text(`${order.customer?.city || ""}, ${order.customer?.state || ""}`, billToX);

    // Ship To
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("SHIP TO", shipToX, sectionY);
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(order.delivery?.address1 || "N/A", shipToX, sectionY + 15)
      .text(order.delivery?.address2 || "N/A", shipToX)
      .text(order.delivery?.city || "", shipToX)
      .text(`${order.delivery?.state || ""}, ${order.delivery?.state || ""}`, shipToX)
      .text(`${order.delivery?.pincode || ""}, ${order.delivery?.pincode || ""}`, shipToX);

    // Divider
    doc.moveTo(40, 220).lineTo(550, 220).stroke();

    // ========== ITEMS TABLE ==========
    const tableTop = 230;
    const columnWidths = [30, 120, 70, 60, 60, 60, 80];
    const headers = ["S.No", "Item", "HSN No.", "Qty", "Rate", "Tax%", "Amount"];

    // Header background
    doc.rect(40, tableTop, 510, 20).fill(primaryColor).fillColor("white");
    doc.font("Helvetica").fontSize(10);

    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x + 5, tableTop + 5, { width: columnWidths[i], align: "left" });
      x += columnWidths[i];
    });
    doc.fillColor(textColor);

    // Table rows
    let y = tableTop + 25;
   order.items.forEach((item, idx) => {
  const row = [
    idx + 1,
    item.name,
    item.model || "-",
    item.quantity,
    `Rs. ${item.price.toFixed(2)}`,          // use ₹ and fix encoding issue below
    `${item.gstPercent}%`,
    `Rs. ${item.totalWithGst.toFixed(2)}`,
  ];

  let x = 40;
  row.forEach((r, i) => {
    doc.text(String(r), x + 5, y, { width: columnWidths[i], align: "left" });
    x += columnWidths[i];
  });
  y += 20;
});


    // Draw line after table
    doc.moveTo(40, y+10).lineTo(550, y+10).stroke();

    // ========== TOTALS ==========
    y += 15;
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text(`Subtotal: Rs. ${order.subtotal?.toFixed(2) || "0.00"}`, 400, y);
    y += 15;
    doc.text(`Total GST: Rs. ${order.totalGST?.toFixed(2) || "0.00"}`, 400, y);
    y += 15;
    doc.text(`Discount: Rs. ${order.discount?.toFixed(2) || "0.00"}`, 400, y);
    y += 15;
    doc.text(`Grand Total: Rs. ${order.totalAmount?.toFixed(2) || "0.00"}`, 400, y);

    // Divider
    y += 10;
    doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke();



    // ========== TERMS & BANK DETAILS ==========
    y += 30;
    doc.font("Helvetica-Bold").fontSize(10).text("Terms & Conditions", 40, y);
    doc.font("Helvetica").fontSize(9);
    doc.text("1. Customer will pay the GST", 40, y + 15);
    doc.text("2. Customer will pay the Delivery charges", 40, y + 30);
    doc.text("3. Pay due amount within 15 days", 40, y + 45);

    // Bank Details
    const bankY = y;
    doc.font("Helvetica-Bold").fontSize(10).text("Bank Details", 250, bankY);
    doc.font("Helvetica").fontSize(9);
    doc.text("Account Holder: Kihaan Enterprises", 250, bankY + 15);
    doc.text("Account No: 123456789", 250, bankY + 30);
    doc.text("Bank: SBI, Branch: Dehradun", 250, bankY + 45);
    doc.text("IFSC: SBIN0004567", 250, bankY + 60);
    doc.text("UPI: kihaan@upi", 250, bankY + 75);

    // Signature
    doc.font("Helvetica-Oblique").fontSize(9).text("Authorized Signatory For Kihaan Enterprises", 450, bankY+75);

    // Footer
    doc.moveDown(3);
    doc.font("Helvetica-Oblique").fontSize(9).fillColor("gray");
    doc.text("Thank you for your business!", { align: "center" });

    doc.end();
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};



