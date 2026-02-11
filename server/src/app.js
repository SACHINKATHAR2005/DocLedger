import "dotenv/config";
import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import { DbHealthCheck } from "./utils/dbHealth.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import orgRoutes from "./routes/orgRoutes.js";
import docsRoutes from "./routes/docsRoutes.js";
import ragRoutes from "./routes/ragRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
const port = process.env.PORT || 8000;
// Health check route
app.get("/Dbhealth", DbHealthCheck);
// Test database connection on startup
pool.query("SELECT NOW()", [], (err, res) => {
    if (err) {
        console.error("Error executing query", err);
    }
    else {
        console.log("Database connected:", res.rows);
    }
});
app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api", ragRoutes);
app.use("/api", chatRoutes);
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=app.js.map