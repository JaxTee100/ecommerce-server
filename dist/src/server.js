"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_route_1 = __importDefault(require("./routes/auth-route"));
const product_routes_1 = __importDefault(require("./routes/product-routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon-routes"));
const settings_routes_1 = __importDefault(require("./routes/settings-routes"));
const cart_routes_1 = __importDefault(require("./routes/cart-routes"));
const address_route_1 = __importDefault(require("./routes/address-route"));
const order_route_1 = __importDefault(require("./routes/order-route"));
const path_1 = __importDefault(require("path"));
//load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const corsOptions = {
    origin: 'http://localhost:3000', //frontend localhost
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Serve uploaded files statically (Important for accessing images)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
exports.prisma = new client_1.PrismaClient();
//routes
//auth routes
app.use('/api/auth', auth_route_1.default);
//product routes
app.use('/api/products', product_routes_1.default);
//coupon routes
app.use('/api/coupon', coupon_routes_1.default);
//setting routes
app.use('/api/settings', settings_routes_1.default);
//cart routes
app.use('/api/cart', cart_routes_1.default);
//address routes
app.use('/api/address', address_route_1.default);
//order routes
app.use('/api/order', order_route_1.default);
app.get('/', (req, res) => {
    res.send('Hello from Ecommerce backend');
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.prisma.$disconnect();
    process.exit();
}));
