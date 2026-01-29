import { response, type Request, type Response } from "express";

import { z } from "zod";
import bcrypt from "bcrypt";
import { findUserByEmail, registerUser } from "../service/authUser.js";
import jwt from "jsonwebtoken";

const signupUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(3),
    password: z.string().min(6)
})


export const signupUser = async (req: Request, res: Response) => {
    try {

        const parsedData = signupUserSchema.safeParse(req.body);

        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: parsedData.error.issues,
                success: false
            })
        }

        const { email, name, password } = parsedData.data;

        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                message: "User with this email already exists",
                success: false
            })
        }



        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = await registerUser(name, email, hashedPassword);
        return res.status(201).json({
            message: "User registered successfully",
            success: true,
            data: userData
        })


    } catch (error: any) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        })

    }
}

const signinUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
})

export const signinUser = async (req: Request, res: Response) => {
    try {
        const paredData = signinUserSchema.safeParse(req.body);
        if (!paredData.success) {
            return res.status(400).json({
                message: "Invalid request data",
                errors: paredData.error.issues,
                success: false
            })
        }
        const { email, password } = paredData.data;

        const existingUser = await findUserByEmail(email);
        if (!existingUser) {
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }

        const isPassowrdMatch = await bcrypt.compare(password, existingUser.password_hash);
        if (!isPassowrdMatch) {
            return res.status(401).json({
                message: "Invalid credentials",
                success: false
            })
        }

        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            return res.status(500).json({
                message: "JWT secret key is not configured",
                success: false
            });
        }

        const token = jwt.sign({
            id: existingUser.id,
            email: existingUser.email
        }, secretKey, {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        })

        const loginUserData = {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email
        }

        return res.status(200).json({
            message: "User logged in successfully",
            success: true,
            data: loginUserData,
            token: token
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: (error as Error).message,
            success: false
        })
    }
}


export const meUser = async (req: Request, res: Response) => {
    try {
        // Check if user exists from middleware
        // if (!req.user) {
        //     return res.status(401).json({
        //         message: "Unauthorized - Please login",
        //         success: false
        //     });
        // }
        
        

        if (!req.user) {
            return res.status(401).json({
                message: "Unauthor.josnized - Please login",
                success: false
            });
        }

        const userEmail = req.user.email;
        const user = await findUserByEmail(userEmail);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            })
        }
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email
        }

        return res.status(200).json({
            message: "User data fetched successfully",
            success: true,
            data: userData
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: (error as Error).message,
            success: false
        })
    }
}

export const logoutUser = async(req:Request,res:Response)=>{
    try {
        // if(!req.cookies?.token){
        //     return res.status(400).json({
        //         message:"No active session found",
        //         success:false
        //     })
        // }

        res.clearCookie("token",{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });
        return res.status(200).json({
            message: "User logged out successfully",
            success: true
        })
        
    } catch (error:any) {
        return res.status(500).json({
           message: "Internal server error",
            error: (error as Error).message,
            success: false
        })
    }
}
