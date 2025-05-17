import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create order endpoint
export const createOrder = async (req, res) => {
  const { amount } = req.body; // amount in paise

  const options = {
    amount: amount, // amount in paise (50000 = Rs 500)
    currency: "INR",
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify payment signature endpoint (optional)
export const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.status(200).json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

