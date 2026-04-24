import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import UserModel from "@/model/auth";
import VerificationModel from "@/model/verifications";
import { sendEmail } from "@/utils/email";
import {
  otpEmailTemplate,
  resendOtpEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
} from "@/utils/emailTemplates";

const SALT_ROUNDS = 10;
const ONE_HOUR = 60 * 60 * 1000;

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);

// POST /api/auth/register
export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await UserModel.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
  });

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, SALT_ROUNDS);

  await VerificationModel.create({
    userId: user._id,
    token: hashedOTP,
    type: "email",
    expiresAt: new Date(Date.now() + ONE_HOUR),
  });

  await sendEmail({
    to: user.email,
    toName: user.name || user.email,
    subject: "Verify Your Email Address",
    html: otpEmailTemplate(user.name || user.email, otp),
  });

  res.status(201).json({
    message: "Account created! Please check your email for a 6-digit verification code.",
    userId: user._id,
  });
};

// POST /api/auth/verify-email
export const verifyEmail: RequestHandler = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP are required." });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(404).json({ error: "No account found with this email." });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ error: "This account is already verified. Please log in." });
    return;
  }

  const record = await VerificationModel.findOne({ userId: user._id, type: "email" });

  if (!record) {
    res.status(400).json({ error: "Verification code not found or has expired. Please request a new one." });
    return;
  }

  const isMatch = await bcrypt.compare(otp, record.token);
  if (!isMatch) {
    res.status(400).json({ error: "Invalid verification code." });
    return;
  }

  user.isVerified = true;
  await user.save();

  await VerificationModel.deleteOne({ _id: record._id });

  const token = signToken(user._id.toString());

  res.status(200).json({
    message: "Email verified successfully! Welcome aboard.",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// POST /api/auth/resend-otp
export const resendOTP: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(404).json({ error: "No account found with this email." });
    return;
  }

  if (user.isVerified) {
    res.status(400).json({ error: "This account is already verified." });
    return;
  }

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, SALT_ROUNDS);

  // Replace any existing record for this user
  await VerificationModel.findOneAndReplace(
    { userId: user._id, type: "email" },
    {
      userId: user._id,
      token: hashedOTP,
      type: "email",
      expiresAt: new Date(Date.now() + ONE_HOUR),
    },
    { upsert: true }
  );

  await sendEmail({
    to: user.email,
    toName: user.name || user.email,
    subject: "Your New Verification Code",
    html: resendOtpEmailTemplate(user.name || user.email, otp),
  });

  res.status(200).json({ message: "A new verification code has been sent to your email." });
};

// POST /api/auth/login
export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({
      error: "Please verify your email before logging in.",
      unverified: true,
    });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const token = signToken(user._id.toString());

  res.status(200).json({
    message: "Login successful.",
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

// POST /api/auth/forgot-password
export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  // Always return 200 to prevent email enumeration
  if (!user || !user.isVerified) {
    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Replace any existing password reset record for this user
  await VerificationModel.findOneAndReplace(
    { userId: user._id, type: "password" },
    {
      userId: user._id,
      token: hashedToken,
      type: "password",
      expiresAt: new Date(Date.now() + ONE_HOUR),
    },
    { upsert: true }
  );

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  await sendEmail({
    to: user.email,
    toName: user.name || user.email,
    subject: "Password Reset Request",
    html: passwordResetEmailTemplate(user.name || user.email, resetLink),
  });

  res.status(200).json({
    message: "If an account with that email exists, a password reset link has been sent.",
  });
};

// POST /api/auth/reset-password/:token
export const resetPassword: RequestHandler = async (req, res) => {
  const token = req.params.token as string;
  const { password } = req.body;

  if (!password) {
    res.status(400).json({ error: "New password is required." });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const record = await VerificationModel.findOne({
    token: hashedToken,
    type: "password",
  });

  if (!record) {
    res.status(400).json({ error: "Reset link is invalid or has expired." });
    return;
  }

  const user = await UserModel.findById(record.userId);
  if (!user) {
    res.status(400).json({ error: "User not found." });
    return;
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS);
  await user.save();

  await VerificationModel.deleteOne({ _id: record._id });

  await sendEmail({
    to: user.email,
    toName: user.name || user.email,
    subject: "Your Password Has Been Changed",
    html: passwordChangedEmailTemplate(user.name || user.email),
  });

  res.status(200).json({ message: "Password reset successfully. You can now log in." });
};
