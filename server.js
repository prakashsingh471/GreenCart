import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';


import connectDB from './configs/db.js';
import connectCloudinary from './configs/cloudinary.js';


import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import paymentRouter from './routes/paymentRoute.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 4000;


await connectDB();
await connectCloudinary();


const whitelist = [
  'http://localhost:5173',
  'http://localhost:4000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      console.log(` CORS Blocked: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(cookieParser());


app.use('/api/user', userRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/address', addressRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRouter);


const frontendPath = path.join(__dirname, 'dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});





