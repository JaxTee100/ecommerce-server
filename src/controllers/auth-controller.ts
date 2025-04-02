import { prisma } from "../server";
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid'

function generateToken(userId: string, email: string, role: string){
    const accessToken = jwt.sign({ userId, email, role }, process.env.JWT_SECRET!, {
        expiresIn: '60m',})
    const refreshToken = uuidv4();
    return { accessToken, refreshToken };
}

async function setTokens(res: Response, accessToken: string, refreshToken: string){
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
    
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password} = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if(existingUser){
            res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data : {
                name,
                email,
                password: hashedPassword,
                role: 'USER'
            }
        })

        res.status(201).json({
            message: "User registered successfully",
            success: true,
            userId: user.id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed' });
    }
}


export const login = async(req: Request, res: Response): Promise<void> =>{
    try {
        const {email, password} = req.body;
        const getCurrentUser = await prisma.user.findUnique({
            where: { email },
        });

        if(!getCurrentUser || !(await bcrypt.compare(password, getCurrentUser.password))){
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        //create our access and refresh token
        const {accessToken, refreshToken} = generateToken(getCurrentUser.id, getCurrentUser.email, getCurrentUser.role);

        //set our tokens
        await setTokens(res, accessToken, refreshToken);
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
    }
}


export const refreshAccessToken = async(req: Request, res: Response): Promise<void> =>{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
        res.status(401).json({
            success: false,
            message: 'No refresh token provided'
        })
    }
    try {
        const user = await prisma.user.findFirst({
            where: {
                refreshToken: refreshToken
            }
        })

        if(!user){
            res.status(401).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        const { accessToken, refreshToken: newRefreshToken} = generateToken(user.id, user.email, user.role);
        await setTokens(res, accessToken, newRefreshToken);
        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to refresh access token' });
        
    }
}


export const logout = async(req: Request, res: Response): Promise<void> =>{
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    }); 

}