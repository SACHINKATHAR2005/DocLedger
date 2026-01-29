import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.token ;

        if(!token){
            return res.status(401).json({
                message:"Unauthorized access - No token provided",
                success:false
            })
        }

        const secretKey = process.env.JWT_SECRET_KEY;
        if(!secretKey){
            return res.status(500).json({
                message:"JWT secret key is not configured",
                success:false
            })
        }
          const decoded = jwt.verify(token,secretKey as string) as {id :string,email:string}

          req.user = {id:decoded.id,email:decoded.email};
          next();

    } catch (error: any) {
        return res.status(401).json({
            message: "Unauthorized access",
            error: error.message,
            success: false
        })
    }
}

export const isAdminMiddleware = (req:Request,res:Response,next:NextFunction)=>{
    try {
        // const userRole = req.user?.
        
    } catch (error:any) {
         return res.status(401).json({
            message: "Unauthorized access",
            error: error.message,
            success: false
        })
    }
}