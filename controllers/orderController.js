import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Razorpay from "razorpay";

// Razorpay Instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Place Order COD : /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // Calculate Amount Using Items
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Add Tax Charge (2%)
    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
    });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Create Razorpay Order : /api/order/razorpay-create-order
export const createRazorpayOrder = async (req, res) => {
  try {
    const { userId, items, address } = req.body;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // Calculate total amount
    let amount = await items.reduce(async (acc, item) => {
      const product = await Product.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    amount += Math.floor(amount * 0.02); // 2% tax charge

    // Create Order in DB with paymentType 'Online' but isPaid false initially
    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "Online",
      isPaid: false,
    });

    // Create Razorpay order
    const options = {
      amount: amount * 100, // in paise (Razorpay works with smallest currency unit)
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order._id,
      razorpayOrder,
    });
  } catch (error) {
     console.error("Razorpay Order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Razorpay Payment webhook or callback handler
export const verifyRazorpayPayment = async (req, res) => {
 

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const crypto = await import('crypto');
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      // Mark order as paid
      await Order.findByIdAndUpdate(orderId, { isPaid: true });

      // Clear user cart (optional)
      const order = await Order.findById(orderId);
      await User.findByIdAndUpdate(order.userId, { cartItems: [] });

      return res.json({ success: true, message: "Payment verified and order updated" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Orders by User ID : /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get All Orders (for seller/admin) : /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
