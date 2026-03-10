const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

// Trigger when a new order is created
exports.newOrderNotification = functions.firestore
  .document("orders/{orderId}")
  .onCreate(async (snap, context) => {
    const order = snap.data();

    const mailOptions = {
      from: `"IRON AURA Orders" <${functions.config().gmail.email}>`,
      to: "Shaikdanish094@gmail.com",
      subject: "🔥 New Order Received – IRON AURA",
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order ID:</strong> ${context.params.orderId}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Address:</strong> ${order.address}</p>
        <hr />
        <p>IRON AURA Admin Notification</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order email sent successfully");
  });
