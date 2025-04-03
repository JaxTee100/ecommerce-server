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
exports.logout = exports.refreshAccessToken = exports.login = exports.register = void 0;
const server_1 = require("../server");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
function generateToken(userId, email, role) {
    const accessToken = jsonwebtoken_1.default.sign({ userId, email, role }, process.env.JWT_SECRET, {
        expiresIn: '60m',
    });
    const refreshToken = (0, uuid_1.v4)();
    return { accessToken, refreshToken };
}
function setTokens(res, accessToken, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60,
        });
    });
}
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const existingUser = yield server_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User already exists'
            });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = yield server_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        });
        res.status(201).json({
            message: "User registered successfully",
            success: true,
            userId: user.id,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed' });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const getCurrentUser = yield server_1.prisma.user.findUnique({
            where: { email },
        });
        if (!getCurrentUser || !(yield bcryptjs_1.default.compare(password, getCurrentUser.password))) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        //create our access and refresh token
        const { accessToken, refreshToken } = generateToken(getCurrentUser.id, getCurrentUser.email, getCurrentUser.role);
        //set our tokens
        yield setTokens(res, accessToken, refreshToken);
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            user: {
                userId: getCurrentUser.id,
                name: getCurrentUser.name,
                email: getCurrentUser.email,
                role: getCurrentUser.role
            },
            accessToken
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
    }
});
exports.login = login;
const refreshAccessToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({
            success: false,
            message: 'No refresh token provided'
        });
    }
    try {
        const user = yield server_1.prisma.user.findFirst({
            where: {
                refreshToken: refreshToken
            }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }
        const { accessToken, refreshToken: newRefreshToken } = generateToken(user.id, user.email, user.role);
        yield setTokens(res, accessToken, newRefreshToken);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to refresh access token' });
    }
});
exports.refreshAccessToken = refreshAccessToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    });
});
exports.logout = logout;
