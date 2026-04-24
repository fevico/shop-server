import { RequestHandler } from "express";
import { File } from "formidable";
import CategoryModel from "@/model/category";
import { uploadImage, deleteImage } from "@/utils/cloudinary";

// POST /api/categories
export const createCategory: RequestHandler = async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400).json({ error: "Category name is required." });
    return;
  }

  const existing = await CategoryModel.findOne({ name: name.trim() });
  if (existing) {
    res.status(409).json({ error: "A category with this name already exists." });
    return;
  }

  const imageFile = req.files?.image as File | undefined;
  let image;

  if (imageFile) {
    image = await uploadImage(imageFile, "shop/categories");
  }

  const category = await CategoryModel.create({ name, description, image });

  res.status(201).json({ message: "Category created successfully.", category });
};

// GET /api/categories
export const getAllCategories: RequestHandler = async (req, res) => {
  const categories = await CategoryModel.find().sort({ createdAt: -1 });
  res.status(200).json({ categories });
};

// GET /api/categories/:id
export const getCategory: RequestHandler = async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) {
    res.status(404).json({ error: "Category not found." });
    return;
  }

  res.status(200).json({ category });
};

// PUT /api/categories/:id
export const updateCategory: RequestHandler = async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) {
    res.status(404).json({ error: "Category not found." });
    return;
  }

  const { name, description } = req.body;
  const imageFile = req.files?.image as File | undefined;

  if (name) category.name = name;
  if (description !== undefined) category.description = description;

  if (imageFile) {
    // Delete the old image from Cloudinary before uploading the new one
    if (category.image?.id) {
      await deleteImage(category.image.id);
    }
    category.image = await uploadImage(imageFile, "shop/categories");
  }

  await category.save();

  res.status(200).json({ message: "Category updated successfully.", category });
};

// DELETE /api/categories/:id
export const deleteCategory: RequestHandler = async (req, res) => {
  const category = await CategoryModel.findById(req.params.id);

  if (!category) {
    res.status(404).json({ error: "Category not found." });
    return;
  }

  if (category.image?.id) {
    await deleteImage(category.image.id);
  }

  await CategoryModel.deleteOne({ _id: category._id });

  res.status(200).json({ message: "Category deleted successfully." });
};
