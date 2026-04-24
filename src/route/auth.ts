import { Router } from "express";
import {
  register,
  verifyEmail,
  resendOTP,
  login,
  forgotPassword,
  resetPassword,
} from "@/controller/auth";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-otp", resendOTP);
authRouter.post("/login", login);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;
