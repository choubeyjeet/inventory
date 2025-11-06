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
    const { customer, delivery, items, totalAmount, totalGST, payment } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // 🧮 1️⃣ Stock validation and update
    const itemUpdates = await Promise.all(
      items.map(async (i) => {
        const item = await Item.findById(i.itemId);
        if (!item) throw new Error(`Item ${i.name} not found`);
        if (item.stock < i.quantity)
          throw new Error(`Insufficient stock for ${i.name}`);

        item.stock -= i.quantity;
        await item.save();
        return item;
      })
    );

    // 🧾 2️⃣ Validate payment info
    if (payment?.status === "partial") {
      if (!payment.amountPaid || payment.amountPaid <= 0) {
        return res.status(400).json({ message: "Invalid paid amount" });
      }
      if (payment.amountPaid > totalAmount) {
        return res.status(400).json({
          message: "Paid amount cannot exceed total amount",
        });
      }
      if (!payment.date) {
        return res.status(400).json({ message: "Payment date is required" });
      }
    }

    // New payment history entry
    const paymentHistoryEntry = {
      amount: payment?.amountPaid || totalAmount,
      date: payment?.date || new Date(), // default to now if fully paid
      method: payment?.method || "unknown", // optional field
      note:
        payment?.status === "partial"
          ? "Partial payment during order creation"
          : "Full payment during order creation",
    };

    // ✅ 3️⃣ Create order with payment data and history
    const order = await Order.create({
      customer,
      delivery,
      items,
      totalAmount,
      totalGST,
      payment: {
        status: payment?.status || "paid",
        amountPaid: payment?.amountPaid || totalAmount,
        remainingBalance:
          payment?.status === "partial"
            ? totalAmount - payment.amountPaid
            : 0,
        date: payment?.date || new Date(),
      },
      paymentHistory: [paymentHistoryEntry],
    });

    // 🧾 4️⃣ Generate invoice HTML
    let htmlContent = "";
    try {
      htmlContent = await generateInvoiceHTML(order);
    } catch (htmlErr) {
      console.error("⚠️ Failed to generate invoice HTML:", htmlErr.message);
    }

    // 📧 5️⃣ Send email asynchronously (if email provided)
    if (customer?.email && htmlContent) {
      (async () => {
        try {
          console.log("📨 Sending email to:", customer.email);
          await sendOrderEmail(customer.email, order, htmlContent);
          console.log("✅ Order email sent to", customer.email);
        } catch (mailErr) {
          console.error("⚠️ Email sending failed:", mailErr.message);
        }
      })();
    }

    // 🚀 6️⃣ Respond to client
    res.status(201).json({
      message: "Order created successfully",
      orderId: order._id,
      invoiceId: order.invoiceId,
      emailStatus:
        customer?.email && htmlContent ? "queued" : "no email or invoice",
    });
  } catch (err) {
    console.error("❌ createOrder error:", err);
    res.status(500).json({ message: err.message });
  }
};



export const generateInvoiceHTML = (order) => {
  const customer = order.customer || {};
  const delivery = order.delivery || {};
  const items = order.items || [];

  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString();
  const invoiceNo = order._id || "N/A";
  const currency = "₹";

  const rowsHtml = items.map((item, idx) => {
    const amount = (item.totalWithGst ?? (item.price * item.quantity)).toFixed(2);
    return `
      <tr>
        <td style="padding:8px;text-align:center;border:1px solid #e6e6e6">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #e6e6e6">${escapeHtml(item.name)}</td>
        <td style="padding:8px;text-align:center;border:1px solid #e6e6e6">${escapeHtml(item.model || "-")}</td>
        <td style="padding:8px;text-align:center;border:1px solid #e6e6e6">${item.quantity}</td>
        <td style="padding:8px;text-align:right;border:1px solid #e6e6e6">${currency}${Number(item.price).toFixed(2)}</td>
        <td style="padding:8px;text-align:center;border:1px solid #e6e6e6">${item.gstPercent ?? 0}%</td>
        <td style="padding:8px;text-align:right;border:1px solid #e6e6e6">${currency}${amount}</td>
      </tr>
    `;
  }).join("");

  const subtotal = (order.subtotal ?? items.reduce((s,i)=> s + (i.price * i.quantity || 0), 0)).toFixed(2);
  const totalGST = (order.totalGST ?? 0).toFixed(2);
  const discount = (order.discount ?? 0).toFixed(2);
  const grandTotal = (order.totalAmount ?? (Number(subtotal) + Number(totalGST) - Number(discount))).toFixed(2);

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Invoice ${invoiceNo}</title>
    <style>
      /* Basic inline-friendly styles */
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#222; margin:0;padding:0; }
      .container { max-width:800px; margin:20px auto; padding:20px; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; }
      .company { color:#f02828; font-weight:700; font-size:22px; }
      .muted { color:#666; font-size:13px; }
      .section { margin-top:18px; display:flex; justify-content:space-between; gap:20px; }
      .card { padding:12px; border:1px solid #eee; border-radius:6px; background:#fff; }
      table { width:100%; border-collapse:collapse; margin-top:12px; }
      th { padding:10px; background:#f02828; color:white; text-align:left; font-weight:600; }
      td { padding:8px; vertical-align:top; }
      .right { text-align:right; }
      .center { text-align:center; }
      .totals { margin-top:12px; width:100%; display:flex; justify-content:flex-end; }
      .totals .box { width:320px; }
      .small { font-size:12px; color:#444; }
      @media print { .container { margin:0; padding:0; } }
    </style>
  </head>
  <body>
    <div class="container" style="background:#fafafa;">
      <div class="header">
        <div>
          <div class="company">Kihaan Enterprises</div>
          <div class="muted">Prem Complex, 27 B, Haridwar Rd, Dehradun, Uttarakhand 248001</div>
          <div class="muted">Phone: 8447594486</div>
          <div class="muted">GSTIN: 05ATTPN0666K1Z5 | PAN: 05ATTPN0666K1Z5</div>
        </div>

        <div style="text-align:right">
          <div style="font-weight:700;font-size:14px">TAX INVOICE</div>
          <div class="small">Invoice No: <strong>${escapeHtml(invoiceNo)}</strong></div>
          <div class="small">Invoice Date: ${escapeHtml(invoiceDate)}</div>
          <div class="small">Email: choubeyjeet2580@gmail.com</div>
          <div class="small">Website: www.kihaanenterprises.com</div>
        </div>
      </div>

      <div class="section">
        <div class="card" style="flex:1">
          <div style="font-weight:700">BILL TO</div>
          <div class="small">${escapeHtml(customer.name || "N/A")}</div>
          <div class="muted">${escapeHtml(customer.email || "N/A")}</div>
          <div class="muted">${escapeHtml(customer.address1 || "")}</div>
          <div class="muted">${escapeHtml(`${customer.city || ""} ${customer.state || ""}`)}</div>
        </div>

        <div class="card" style="flex:1">
          <div style="font-weight:700">SHIP TO</div>
          <div class="small">${escapeHtml(delivery.address1 || "N/A")}</div>
          <div class="muted">${escapeHtml(delivery.address2 || "")}</div>
          <div class="muted">${escapeHtml(delivery.city || "")}</div>
          <div class="muted">${escapeHtml(`${delivery.state || ""} ${delivery.pincode || ""}`)}</div>
        </div>
      </div>

      <div style="margin-top:16px" class="card">
        <table>
          <thead>
            <tr>
              <th style="width:40px">S.No</th>
              <th>Item</th>
              <th style="width:90px">HSN No.</th>
              <th style="width:60px">Qty</th>
              <th style="width:90px">Rate</th>
              <th style="width:70px">Tax%</th>
              <th style="width:100px" class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="totals">
        <div class="box card">
          <div style="display:flex;justify-content:space-between;padding:6px 0">
            <div class="small">Subtotal</div>
            <div class="small right">${currency}${subtotal}</div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0">
            <div class="small">Total GST</div>
            <div class="small right">${currency}${totalGST}</div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0">
            <div class="small">Discount</div>
            <div class="small right">-${currency}${discount}</div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px dashed #eee">
            <div style="font-weight:700">Grand Total</div>
            <div style="font-weight:700" class="right">${currency}${grandTotal}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;display:flex;gap:20px">
        <div style="flex:1" class="card">
          <div style="font-weight:700">Terms & Conditions</div>
          <div class="small">1. Customer will pay the GST</div>
          <div class="small">2. Customer will pay the Delivery charges</div>
          <div class="small">3. Pay due amount within 15 days</div>
        </div>

        <div style="width:300px" class="card">
          <div style="font-weight:700">Bank Details</div>
          <div class="small">Account Holder: Kihaan Enterprises</div>
          <div class="small">Account No: 123456789</div>
          <div class="small">Bank: SBI, Branch: Dehradun</div>
          <div class="small">IFSC: SBIN0004567</div>
          <div class="small">UPI: kihaan@upi</div>
        </div>
      </div>

      <div style="text-align:center;margin-top:18px;color:#888;font-size:13px">Thank you for your business!</div>
    </div>
  </body>
  </html>
  `;
};

/* small helper to escape user-provided text for safe HTML insertion */
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// export const generateInvoicePDF = async (order) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 40 });
//       const stream = new streamBuffers.WritableStreamBuffer({
//         initialSize: 1024 * 1024, // 1MB
//         incrementAmount: 512 * 1024, // Grow by 512KB chunks
//       });

//       // Pipe PDF data into the memory buffer
//       doc.pipe(stream);

//       const primaryColor = "#f02828";
//       const textColor = "#000000";

//       // ========== HEADER ==========
//       const leftX = 40;
//       const rightX = 330;
//       const topY = 40;

//       doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(20).text("Kihaan Enterprises", leftX, topY);

//       doc
//         .fillColor(textColor)
//         .font("Helvetica")
//         .fontSize(10)
//         .text("Prem Complex, 27 B, Haridwar Rd,", leftX, topY + 25)
//         .text("Dehradun, Uttarakhand 248001", leftX)
//         .text("Phone: 8447594486", leftX)
//         .text("GSTIN: 05ATTPN0666K1Z5", leftX)
//         .text("PAN: 05ATTPN0666K1Z5", leftX);

//       doc.font("Helvetica-Bold").fontSize(12).text("TAX INVOICE", rightX, topY);
//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .text(`Invoice No: ${order._id}`, rightX)
//         .text(`Invoice Date: ${new Date(order.createdAt).toLocaleDateString()}`, rightX)
//         .text(`Email: choubeyjeet2580@gmail.com`, rightX)
//         .text(`Website: www.kihaanenterprises.com`, rightX);

//       doc.moveTo(40, 130).lineTo(550, 130).stroke();

//       // ========== BILL TO / SHIP TO ==========
//       const billToX = 40;
//       const shipToX = 330;
//       const sectionY = 140;

//       doc.font("Helvetica-Bold").fontSize(12).text("BILL TO", billToX, sectionY);
//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .text(order.customer?.name || "N/A", billToX, sectionY + 15)
//         .text(order.customer?.email || "N/A", billToX)
//         .text(order.customer?.address1 || "", billToX)
//         .text(`${order.customer?.city || ""}, ${order.customer?.state || ""}`, billToX);

//       doc.font("Helvetica-Bold").fontSize(12).text("SHIP TO", shipToX, sectionY);
//       doc
//         .font("Helvetica")
//         .fontSize(10)
//         .text(order.delivery?.address1 || "N/A", shipToX, sectionY + 15)
//         .text(order.delivery?.address2 || "N/A", shipToX)
//         .text(order.delivery?.city || "", shipToX)
//         .text(`${order.delivery?.state || ""}, ${order.delivery?.pincode || ""}`, shipToX);

//       doc.moveTo(40, 220).lineTo(550, 220).stroke();

//       // ========== ITEMS TABLE ==========
//       const tableTop = 230;
//       const columnWidths = [30, 120, 70, 60, 60, 60, 80];
//       const headers = ["S.No", "Item", "HSN No.", "Qty", "Rate", "Tax%", "Amount"];

//       doc.rect(40, tableTop, 510, 20).fill(primaryColor).fillColor("white");
//       doc.font("Helvetica").fontSize(10);

//       let x = 40;
//       headers.forEach((h, i) => {
//         doc.text(h, x + 5, tableTop + 5, { width: columnWidths[i], align: "left" });
//         x += columnWidths[i];
//       });
//       doc.fillColor(textColor);

//       let y = tableTop + 25;
//       order.items.forEach((item, idx) => {
//         const row = [
//           idx + 1,
//           item.name,
//           item.model || "-",
//           item.quantity,
//           `₹${item.price.toFixed(2)}`,
//           `${item.gstPercent}%`,
//           `₹${item.totalWithGst.toFixed(2)}`,
//         ];

//         let x = 40;
//         row.forEach((r, i) => {
//           doc.text(String(r), x + 5, y, { width: columnWidths[i], align: "left" });
//           x += columnWidths[i];
//         });
//         y += 20;
//       });

//       doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke();

//       // ========== TOTALS ==========
//       y += 15;
//       doc.font("Helvetica-Bold").fontSize(10);
//       doc.text(`Subtotal: ₹${order.subtotal?.toFixed(2) || "0.00"}`, 400, y);
//       y += 15;
//       doc.text(`Total GST: ₹${order.totalGST?.toFixed(2) || "0.00"}`, 400, y);
//       y += 15;
//       doc.text(`Discount: ₹${order.discount?.toFixed(2) || "0.00"}`, 400, y);
//       y += 15;
//       doc.text(`Grand Total: ₹${order.totalAmount?.toFixed(2) || "0.00"}`, 400, y);

//       doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke();

//       // ========== TERMS & BANK DETAILS ==========
//       y += 30;
//       doc.font("Helvetica-Bold").fontSize(10).text("Terms & Conditions", 40, y);
//       doc.font("Helvetica").fontSize(9);
//       doc.text("1. Customer will pay the GST", 40, y + 15);
//       doc.text("2. Customer will pay the Delivery charges", 40, y + 30);
//       doc.text("3. Pay due amount within 15 days", 40, y + 45);

//       const bankY = y;
//       doc.font("Helvetica-Bold").fontSize(10).text("Bank Details", 250, bankY);
//       doc.font("Helvetica").fontSize(9);
//       doc.text("Account Holder: Kihaan Enterprises", 250, bankY + 15);
//       doc.text("Account No: 123456789", 250, bankY + 30);
//       doc.text("Bank: SBI, Branch: Dehradun", 250, bankY + 45);
//       doc.text("IFSC: SBIN0004567", 250, bankY + 60);
//       doc.text("UPI: kihaan@upi", 250, bankY + 75);

//       doc.font("Helvetica-Oblique").fontSize(9).text("Authorized Signatory For Kihaan Enterprises", 400, bankY + 95);

//       doc.moveDown(3);
//       doc.font("Helvetica-Oblique").fontSize(9).fillColor("gray").text("Thank you for your business!", { align: "center" });

//       // ✅ Important: close document properly
//       doc.end();

//       // ✅ Wait for PDF data to fully flush before resolving
//       stream.on("finish", () => {
//         try {
//           const buffer = stream.getContents();
//           resolve(buffer);
//         } catch (err) {
//           reject(err);
//         }
//       });

//       // ✅ Catch any stream error (Render-safe)
//       stream.on("error", (err) => reject(err));
//     } catch (err) {
//       reject(err);
//     }
//   });
// };


export const sendOrderEmail = async (to, order, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or your SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
const subject = `Order Confirmation - Invoice ${order._id}`
  await transporter.sendMail({
    from: `"Inventory System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlContent,
  });
};

// ✅ Get All Orders
export const getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", fromDate, toDate, payment } = req.query;
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

    // 💳 Payment status filter
    if (payment) {
      query["payment.status"] = payment; // expects 'paid' or 'partial'
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
      filters: { search, fromDate, toDate, payment },
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
    const { customer, delivery, items, totalAmount, totalGST, payment, paymentHistory } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 🧠 Map previous quantities
    const prevQuantities = {};
    order.items.forEach((i) => {
      prevQuantities[i.itemId.toString()] = i.quantity;
    });

    // 🧮 Adjust stock for updated items
    for (const i of items) {
      const item = await Item.findById(i.itemId);
      if (!item) return res.status(404).json({ message: `Item ${i.name} not found` });

      const prevQty = prevQuantities[i.itemId.toString()] || 0;
      const diff = i.quantity - prevQty;

      if (diff > 0) {
        if (item.stock < diff)
          return res.status(400).json({ message: `Insufficient stock for ${i.name}` });
        item.stock -= diff;
      } else if (diff < 0) {
        item.stock += Math.abs(diff);
      }

      await item.save();
    }

    // 🧹 Handle items removed from the updated order
    for (const oldItem of order.items) {
      if (!items.find((i) => i.itemId === oldItem.itemId.toString())) {
        const item = await Item.findById(oldItem.itemId);
        if (item) {
          item.stock += oldItem.quantity;
          await item.save();
        }
      }
    }

    // ✅ Update main fields
    order.customer = customer || order.customer;
    order.delivery = delivery || order.delivery;
    order.items = items || order.items;
    order.totalAmount = totalAmount ?? order.totalAmount;
    order.totalGST = totalGST ?? order.totalGST;

    // 🧾 Update Payment Info & Entire Payment History
    if (payment) {
      if (!payment.date) {
        return res.status(400).json({ message: "Payment date is required" });
      }

      if (payment.amountPaid > totalAmount) {
        return res.status(400).json({ message: "Paid amount cannot exceed total amount" });
      }

      order.payment = {
        status: payment.status || "paid",
        amountPaid: payment.amountPaid || 0,
        remainingBalance: totalAmount - (payment.amountPaid || 0),
        date: payment.date,
      };
    }

    if (Array.isArray(paymentHistory)) {
      order.paymentHistory = paymentHistory; // 🆕 Replace entire history
    }

    await order.save();

    res.json({ message: "Order updated successfully", orderId: order._id });
  } catch (err) {
    console.error("❌ updateOrder error:", err);
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


