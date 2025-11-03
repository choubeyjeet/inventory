import nodemailer from "nodemailer";




export const sendLowStockSummary = async (items) => {
  const subject = "📦 Daily Low Stock Summary - Kihaan Enterprises";


 const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // app password
    },
  });


  if (!items.length) {
    console.log("✅ No low stock items. No email sent.");
    return;
  }

  const tableRows = items
    .map(
      (i, idx) => `
      <tr style="text-align:center;">
        <td>${idx + 1}</td>
        <td>${i.name}</td>
        <td>${i.modelNo || "-"}</td>
        <td>${i.stock}</td>
        <td>₹${i.price.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const html = `
    <h2>Daily Low Stock Report</h2>
    <p>The following items have stock levels below <strong>10</strong>:</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
      <thead style="background:#f47629;color:white;">
        <tr>
          <th>#</th>
          <th>Item Name</th>
          <th>HSN No.</th>
          <th>Stock</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <br/>
    <p style="font-size:12px;color:gray;">— Kihaan Enterprises Inventory System</p>
  `;

  const recipients = [
    "choubeyjeet2580@gmail.com",
    "kihaanenterprises@gmail.com",
    "negi.ajay108@gmail.com",
    "negipraveen14@gmail.com",
  ];

  try {
    await transporter.sendMail({
      from: `"Kihaan Enterprises" <${process.env.EMAIL_USER}>`,
      to: recipients,
      subject,
      html,
    });
    console.log("📧 Low stock summary email sent successfully!");
  } catch (err) {
    console.error("❌ Failed to send low stock email:", err);
  }
};
