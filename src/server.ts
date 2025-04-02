import { PrismaClient } from "@prisma/client";
import dotenv from 'dotenv'
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import AuthRoutes from './routes/auth-route';
import ProductRoutes from './routes/product-routes';
import CouponRoutes from './routes/coupon-routes';
import SettingsRoutes from './routes/settings-routes';
import CartRoutes from './routes/cart-routes';
import AddressRoutes from './routes/address-route';
import OrderRoutes from './routes/order-route';

import path from "path";



//load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
    origin: 'http://localhost:3000', //frontend localhost
    credentials: true,  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Serve uploaded files statically (Important for accessing images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

export const prisma = new PrismaClient();

//routes
//auth routes
app.use('/api/auth', AuthRoutes);

//product routes
app.use('/api/products', ProductRoutes);

//coupon routes
app.use('/api/coupon', CouponRoutes);

//setting routes
app.use('/api/settings', SettingsRoutes);

//cart routes
app.use('/api/cart', CartRoutes);

//address routes
app.use('/api/address', AddressRoutes);

//order routes
app.use('/api/order', OrderRoutes)


app.get('/', (req, res) => {
    res.send('Hello from Ecommerce backend');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});