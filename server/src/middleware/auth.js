import jwt from "jsonwebtoken";
export const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access - No token provided",
                success: false
            });
        }
        const secretKey = process.env.JWT_SECRET_KEY;
        if (!secretKey) {
            return res.status(500).json({
                message: "JWT secret key is not configured",
                success: false
            });
        }
        const decoded = jwt.verify(token, secretKey);
        req.user = { id: decoded.id, email: decoded.email };
        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "Unauthorized access",
            error: error.message,
            success: false
        });
    }
};
export const isAdminMiddleware = (req, res, next) => {
    try {
        // const userRole = req.user?.
    }
    catch (error) {
        return res.status(401).json({
            message: "Unauthorized access",
            error: error.message,
            success: false
        });
    }
};
//# sourceMappingURL=auth.js.map