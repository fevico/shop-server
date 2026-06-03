import "@/dns-setup";
import "express-async-errors";
import express from "express";
import "dotenv/config";
import "@/db/connect";
import cors from "cors";
import authRouter from "@/route/auth";
import categoryRouter from "@/route/category";
import productRouter from "@/route/product";
import { errorHandler } from "@/middleware/error";
import paymentRouter from "@/route/payment";
import { paystackWebhook } from "@/controller/payment";

const app = express();

app.use(cors({ origin: [process.env.APP_URL!], credentials: true }));

// ─── Paystack Webhook (raw body BEFORE express.json) ─────────────────────────
// Paystack HMAC verification requires the raw, unparsed body.
// This must be registered BEFORE the express.json() middleware below.
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhook
);

// ─── Standard body parsers ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/payment", paymentRouter); 

app.use(errorHandler);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});