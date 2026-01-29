


import { pool } from "../config/db.js";

export const DbHealthCheck = async(_req:any,res:any)=>{
    try {
        await pool.query("SELECT NOW()");
        return res.status(200).json({
            message:"Database connected successfully",
            
        })
        
    } catch (error:any) {
       res.status(500).json({ status: "db down" });
    }
}