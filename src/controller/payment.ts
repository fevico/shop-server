import { RequestHandler } from "express";
import https from "https";
import crypto from "crypto";
import ProductModel from "@/model/product";
import OrderModel from "@/model/orders";
import UserModel from "@/model/auth";
import { sendEmail } from "@/utils/email";
import { orderConfirmationEmailTemplate } from "@/utils/emailTemplates";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate a short unique order number like ORD-20240528-X7K2 */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `ORD-${date}-${suffix}`;
};

/** Call the Paystack API using Node's built-in https */
const paystackRequest = (
  path: string,
  method: "POST" | "GET",
  body?: object
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;

    const options: https.RequestOptions = {
      hostname: "api.paystack.co",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET!}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid JSON from Paystack"));
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
};

// ─── POST /api/payment/intent ─────────────────────────────────────────────────
/**
 * 1. Validate items against DB prices (never trust client-side prices).
 * 2. Create a PENDING order in MongoDB.
 * 3. Initialize Paystack with the orderNumber stored in metadata.
 * 4. Return the Paystack authorization_url to the client.
 */
export const paymentIntent: RequestHandler = async (req, res) => {
  const { items, shippingAddress } = req.body;
  const user = req.user!;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: "Order items are required." });
    return;
  }

  // Validate every item and compute the real total from DB
  let totalAmount = 0;
  const validatedItems: { productId: any; price: number; quantity: number }[] = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      res.status(400).json({ error: "Each item must have a productId and a valid quantity." });
      return;
    }

    const product = await ProductModel.findById(item.productId);
    if (!product) {
      res.status(404).json({ error: `Product with id ${item.productId} not found.` });
      return;
    }
    if (!product.isActive) {
      res.status(400).json({ error: `Product "${product.name}" is no longer available.` });
      return;
    }
    if (product.stock < item.quantity) {
      res.status(400).json({
        error: `Insufficient stock for "${product.name}". Available: ${product.stock}.`,
      });
      return;
    }

    totalAmount += product.price * item.quantity;
    validatedItems.push({
      productId: product._id,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const orderNumber = generateOrderNumber();

  // Create the pending order — will be marked "paid" by the webhook
  const order = await OrderModel.create({
    userId: user._id,
    orderItems: validatedItems,
    reference: `pending-${orderNumber}`, // placeholder; updated by webhook with real Paystack ref
    orderNumber,
    status: "pending",
    totalAmount,
    shippingAddress: shippingAddress || undefined,
  });

  // Initialize Paystack transaction
  const paystackRes = await paystackRequest("/transaction/initialize", "POST", {
    email: user.email,
    amount: Math.round(totalAmount * 100), // Paystack uses kobo
    callback_url: `${process.env.APP_URL}/payment-successful`,
    metadata: {
      orderNumber,
      orderId: order._id.toString(),
      userId: user._id.toString(),
    },
  });
            
  if (!paystackRes.status) {
    // Roll back the pending order if Paystack fails
    await OrderModel.deleteOne({ _id: order._id });
    res.status(502).json({ error: "Failed to initialize payment. Please try again." });
    return;
  }

  res.status(200).json({
    message: "Payment initialized.",
    authorization_url: paystackRes.data.authorization_url,
    access_code: paystackRes.data.access_code,
    reference: paystackRes.data.reference,
    orderNumber,
  });
};

// ─── POST /api/payment/webhook ────────────────────────────────────────────────
/**
 * Paystack sends a signed POST request here when a transaction is completed.
 * We verify the HMAC-SHA512 signature, then mark the order as paid.
 *
 * IMPORTANT: This route must receive the raw body — mount it BEFORE express.json().
 * In index.ts register it as:
 *   app.post("/api/payment/webhook", express.raw({ type: "application/json" }), paystackWebhook);
 */
export const paystackWebhook: RequestHandler = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET!;
  const signature = req.headers["x-paystack-signature"] as string;

  // Verify the request genuinely came from Paystack
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body) // raw Buffer — express.raw() gives us this
    .digest("hex");

  if (hash !== signature) {
    res.status(401).json({ error: "Invalid signature." });
    return;
  }

  const event = JSON.parse(req.body.toString());

  // Only handle successful charge events
  if (event.event !== "charge.success") {
    res.sendStatus(200);
    return;
  }

  const { reference, metadata, amount } = event.data;
  const { orderNumber, orderId } = metadata || {};

  if (!orderId) {
    res.sendStatus(200);
    return;
  }

  const order = await OrderModel.findById(orderId);

  if (!order || order.status === "paid") {
    // Already processed or not found — acknowledge to stop retries
    res.sendStatus(200);
    return;
  }

  // Update order: set real reference, mark as paid
  order.reference = reference;
  order.status = "paid";
  order.totalAmount = amount / 100; // convert kobo back to naira
  await order.save();

  // Send confirmation email to the customer
  try {     
    const user = await UserModel.findById(order.userId);
    if (user) { 
      // Populate product details for the email
      const populatedOrder = await OrderModel.findById(order._id).populate<{
        orderItems: { productId: { name: string; images: { url: string }[] }; price: number; quantity: number }[];
      }>("orderItems.productId", "name images");

      const emailItems = (populatedOrder?.orderItems ?? []).map((item) => ({
        name: item.productId?.name ?? "Product",
        price: item.price,
        quantity: item.quantity,
        image: item.productId?.images?.[0]?.url, 
      }));

      await sendEmail({
        to: user.email,
        toName: user.name || user.email,
        subject: `Order Confirmed — #${orderNumber}`,
        html: orderConfirmationEmailTemplate(
          user.name || user.email,
          orderNumber,
          reference,
          emailItems,
          order.totalAmount,
          order.shippingAddress
        ),
      });
    }
  } catch (emailErr) {
    // Don't fail the webhook if email fails
    console.error("Order confirmation email failed:", emailErr);
  }

  res.sendStatus(200);
};

// ─── GET /api/payment/my-orders ───────────────────────────────────────────────
/** Returns paginated orders belonging to the authenticated user along with totalSpent and totalOrders. */
export const getMyOrders: RequestHandler = async (req, res) => {
  const { page = "1", limit = "10" } = req.query;
  const userId = req.user!._id;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await OrderModel.countDocuments({ userId });

  // Fetch paginated orders with populated product details (name and images)
  const orders = await OrderModel.find({ userId })
    .populate("orderItems.productId", "name images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Calculate total amount spent by the user on successfully paid/processing/completed orders
  const spentAggregation = await OrderModel.aggregate([
    {
      $match: {
        userId,
        status: { $in: ["paid", "processing", "shipped", "delivered"] },
      },
    },
    {
      $group: {
        _id: null,
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalSpent = spentAggregation[0]?.totalSpent || 0;

  res.status(200).json({
    totalOrders: total,
    totalSpent,
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// ─── GET /api/payment/orders ──────────────────────────────────────────────────
/** Admin: paginated list of ALL orders with user info. */
export const getAllOrders: RequestHandler = async (req, res) => {
  const { page = "1", limit = "20", status } = req.query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const total = await OrderModel.countDocuments(filter);

  const orders = await OrderModel.find(filter)
    .populate("userId", "name email")
    .populate("orderItems.productId", "name images")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// ─── GET /api/payment/orders/:id ─────────────────────────────────────────────
/** Admin: full details of a single order. */
export const getOrderById: RequestHandler = async (req, res) => {
  const order = await OrderModel.findById(req.params.id)
    .populate("userId", "name email")
    .populate("orderItems.productId", "name images price");

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.status(200).json({ order });
};

// ─── PATCH /api/payment/orders/:id/status ────────────────────────────────────
/** Admin: update the status of an order (e.g. processing → shipped). */
export const updateOrderStatus: RequestHandler = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}.` });
    return;
  }

  const order = await OrderModel.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("userId", "name email");

  if (!order) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.status(200).json({ message: "Order status updated.", order });
};

// ─── GET /api/payment/admin/dashboard-stats ──────────────────────────────────
/** Admin: Returns total revenue, total orders, total customers, products, and 6-month chart trends in one request. */
export const getAdminDashboardStats: RequestHandler = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. Total Revenue (Successful payments: paid, processing, shipped, delivered)
    const totalRevenueAgg = await OrderModel.aggregate([
      { $match: { status: { $in: ["paid", "processing", "shipped", "delivered"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    // Current Month Revenue
    const currentMonthRevenueAgg = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth },
          status: { $in: ["paid", "processing", "shipped", "delivered"] }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const currentMonthRevenue = currentMonthRevenueAgg[0]?.total || 0;

    // Last Month Revenue
    const lastMonthRevenueAgg = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
          status: { $in: ["paid", "processing", "shipped", "delivered"] }
        }
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const lastMonthRevenue = lastMonthRevenueAgg[0]?.total || 0;

    let revenuePercentageChange = 0;
    if (lastMonthRevenue > 0) {
      revenuePercentageChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      revenuePercentageChange = 100;
    }

    // 2. Total Orders
    const totalOrders = await OrderModel.countDocuments();
    const currentMonthOrders = await OrderModel.countDocuments({ createdAt: { $gte: startOfCurrentMonth } });
    const lastMonthOrders = await OrderModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } });

    let ordersPercentageChange = 0;
    if (lastMonthOrders > 0) {
      ordersPercentageChange = ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    } else if (currentMonthOrders > 0) {
      ordersPercentageChange = 100;
    }

    // 3. Total Customers (role: "user")
    const totalCustomers = await UserModel.countDocuments({ role: "user" });
    const currentMonthCustomers = await UserModel.countDocuments({ role: "user", createdAt: { $gte: startOfCurrentMonth } });
    const lastMonthCustomers = await UserModel.countDocuments({ role: "user", createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } });

    let customersPercentageChange = 0;
    if (lastMonthCustomers > 0) {
      customersPercentageChange = ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100;
    } else if (currentMonthCustomers > 0) {
      customersPercentageChange = 100;
    }

    // 4. Products Inventory
    const totalProducts = await ProductModel.countDocuments();
    const currentMonthProducts = await ProductModel.countDocuments({ createdAt: { $gte: startOfCurrentMonth } });
    const lastMonthProducts = await ProductModel.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth } });

    let productsPercentageChange = 0;
    if (lastMonthProducts > 0) {
      productsPercentageChange = ((currentMonthProducts - lastMonthProducts) / lastMonthProducts) * 100;
    } else if (currentMonthProducts > 0) {
      productsPercentageChange = 100;
    }

    // 5. Chart Data: Monthly Revenue and Order counts for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyStats = await OrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: ["paid", "processing", "shipped", "delivered"] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() - i);
      const year = targetDate.getFullYear();
      const monthIndex = targetDate.getMonth();
      const label = monthNames[monthIndex];

      const stat = monthlyStats.find(s => s._id.year === year && s._id.month === (monthIndex + 1));

      chartData.push({
        month: label,
        revenue: stat ? stat.revenue : 0,
        orders: stat ? stat.orders : 0
      });
    }

    res.status(200).json({
      kpis: {
        revenue: {
          value: totalRevenue,
          percentage: Number(revenuePercentageChange.toFixed(1))
        },
        orders: {
          value: totalOrders,
          percentage: Number(ordersPercentageChange.toFixed(1))
        },
        customers: {
          value: totalCustomers,
          percentage: Number(customersPercentageChange.toFixed(1))
        },
        products: {
          value: totalProducts,
          percentage: Number(productsPercentageChange.toFixed(1))
        }
      },
      chartData
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load dashboard statistics." });
  }
};