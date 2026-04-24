import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "@/controller/product";
import { isAuthenticated, isAdmin } from "@/middleware/auth";
import { fileParser } from "@/middleware/file";

const productRouter = Router();

productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProduct);

productRouter.post("/", isAuthenticated, isAdmin, fileParser, createProduct);
productRouter.put("/:id", isAuthenticated, isAdmin, fileParser, updateProduct);
productRouter.delete("/:id", isAuthenticated, isAdmin, deleteProduct);

export default productRouter;
