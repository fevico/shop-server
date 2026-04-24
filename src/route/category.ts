import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "@/controller/category";
import { isAuthenticated, isAdmin } from "@/middleware/auth";
import { fileParser } from "@/middleware/file";

const categoryRouter = Router();

categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:id", getCategory);

categoryRouter.post("/", isAuthenticated, isAdmin, fileParser, createCategory);
categoryRouter.put("/:id", isAuthenticated, isAdmin, fileParser, updateCategory);
categoryRouter.delete("/:id", isAuthenticated, isAdmin, deleteCategory);

export default categoryRouter;
