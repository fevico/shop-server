import { Router } from "express";
import {
  paymentIntent,
  paystackWebhook,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getAdminDashboardStats,
} from "@/controller/payment";
import { isAuthenticated, isAdmin } from "@/middleware/auth";

const paymentRouter = Router();

// ── Payment initialization (authenticated users only) ──────────────────────
paymentRouter.post("/intent", isAuthenticated, paymentIntent);

// ── Paystack webhook (public — verified by HMAC signature) ────────────────
// NOTE: This route is registered with express.raw() in index.ts (see below)
paymentRouter.post("/webhook", paystackWebhook);

// ── User: view own orders ─────────────────────────────────────────────────
paymentRouter.get("/my-orders", isAuthenticated, getMyOrders);

// ── Admin: dashboard stats + all orders + single order detail + status update ──
paymentRouter.get("/admin/dashboard-stats", isAuthenticated, isAdmin, getAdminDashboardStats);
paymentRouter.get("/orders", isAuthenticated, isAdmin, getAllOrders);
paymentRouter.get("/orders/:id", isAuthenticated, isAdmin, getOrderById);  
paymentRouter.patch("/orders/:id/status", isAuthenticated, isAdmin, updateOrderStatus); 
  
export default paymentRouter; 