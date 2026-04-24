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

const app = express();

app.use(cors({ origin: [process.env.APP_URL!], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);

app.use(errorHandler);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
