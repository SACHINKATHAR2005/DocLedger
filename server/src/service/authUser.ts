import { pool } from "../config/db.js";


export const registerUser = async (name:string,email:string,hashedPassword:string)=>{
    try {
        const result = await pool.query(
            "INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email",
            [name,email,hashedPassword]
        )
        return result.rows[0];
    } catch (error:any) {
        console.error("Error registering user:", error);
        throw new Error("Failed to register user");
    }
}

export const findUserByEmail = async (email:string)=>{
    try {
        const result = await pool.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        )
        return result.rows[0];
        
    } catch (error:any) {
        console.error("Error finding user by email:", error);
        throw new Error("Failed to find user by email");
    }
}

