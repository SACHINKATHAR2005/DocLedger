import { Router } from "express";
import { logoutUser, meUser, signinUser, signupUser } from "../controllers/authUserControllers.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();


// http://localhost:8000/api/auth/signup
router.post("/signup",signupUser);

router.post("/signin",signinUser)

router.get("/me",authMiddleware,meUser)

router.post("/logout",authMiddleware,logoutUser);

export default router;