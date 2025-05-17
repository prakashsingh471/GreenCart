import express from 'express';
import authUser from '../middlewares/authUser.js';
import authSeller from '../middlewares/authSeller.js';

import { 
  getAllOrders, 
  getUserOrders, 
  placeOrderCOD, 
  createRazorpayOrder,      // Razorpay order creation
  verifyRazorpayPayment    // Razorpay payment verification
} from '../controllers/orderController.js';

const orderRouter = express.Router();

// Place order with Cash on Delivery
orderRouter.post('/cod', authUser, placeOrderCOD);

// Get orders for logged-in user
orderRouter.get('/user', authUser, getUserOrders);

// Get all orders for seller/admin
orderRouter.get('/seller', authSeller, getAllOrders);

// Create Razorpay order
orderRouter.post('/razorpay-create-order', authUser, createRazorpayOrder);

// Verify Razorpay payment (webhook or frontend verification)
orderRouter.post('/razorpay-verify', authUser, verifyRazorpayPayment);

export default orderRouter;
