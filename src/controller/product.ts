import { RequestHandler } from "express";
import { File } from "formidable";
import ProductModel from "@/model/product";
import CategoryModel from "@/model/category";
import { uploadImage, deleteImage, CloudinaryImage } from "@/utils/cloudinary";

// POST /api/products
export const createProduct: RequestHandler = async (req, res) => {
  const { name, description, price, stock, category } = req.body;

  if (!name || !price || !category) {
    res.status(400).json({ error: "Name, price, and category are required." });
    return;
  }

  const categoryExists = await CategoryModel.findById(category);
  if (!categoryExists) {
    res.status(404).json({ error: "Category not found." });
    return;
  }

  // Support single file (image) or multiple files (images)
  const rawImages = req.files?.images;
  const imageFiles: File[] = rawImages
    ? Array.isArray(rawImages)
      ? rawImages
      : [rawImages]
    : [];

  const images: CloudinaryImage[] = await Promise.all(
    imageFiles.map((file) => uploadImage(file, "shop/products"))
  );

  const product = await ProductModel.create({
    name,
    description,
    price: Number(price),
    stock: stock ? Number(stock) : 0,
    category,
    images,
  });

  res.status(201).json({ message: "Product created successfully.", product });
};

// GET /api/products
export const getAllProducts: RequestHandler = async (req, res) => {
  const { category, minPrice, maxPrice, inStock, page = "1", limit = "20" } = req.query;

  const filter: Record<string, unknown> = { isActive: true };

  if (category) filter.category = category;
  if (inStock === "true") filter.stock = { $gt: 0 };
  if (minPrice || maxPrice) {
    filter.price = {
      ...(minPrice ? { $gte: Number(minPrice) } : {}),
      ...(maxPrice ? { $lte: Number(maxPrice) } : {}),
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await ProductModel.countDocuments(filter);
  const products = await ProductModel.find(filter)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    products,
    pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

// GET /api/products/:id
export const getProduct: RequestHandler = async (req, res) => {
  const product = await ProductModel.findById(req.params.id).populate("category", "name description");

  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  res.status(200).json({ product });
};

// PUT /api/products/:id
export const updateProduct: RequestHandler = async (req, res) => {
  const product = await ProductModel.findById(req.params.id);

  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  const { name, description, price, stock, category, isActive, removeImages } = req.body;

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (stock !== undefined) product.stock = Number(stock);
  if (isActive !== undefined) product.isActive = isActive === "true" || isActive === true;

  if (category) {
    const categoryExists = await CategoryModel.findById(category);
    if (!categoryExists) {
      res.status(404).json({ error: "Category not found." });
      return;
    }
    product.category = category;
  }

  // Remove specific images by their Cloudinary id
  if (removeImages) {
    const idsToRemove: string[] = Array.isArray(removeImages) ? removeImages : [removeImages];
    await Promise.all(idsToRemove.map((id) => deleteImage(id)));
    product.images = product.images.filter((img) => !idsToRemove.includes(img.id));
  }

  // Upload and append new images
  const rawImages = req.files?.images;
  const imageFiles: File[] = rawImages
    ? Array.isArray(rawImages)
      ? rawImages
      : [rawImages]
    : [];

  if (imageFiles.length > 0) {
    const newImages = await Promise.all(
      imageFiles.map((file) => uploadImage(file, "shop/products"))
    );
    product.images.push(...newImages);
  }

  await product.save();

  res.status(200).json({ message: "Product updated successfully.", product });
};

// DELETE /api/products/:id
export const deleteProduct: RequestHandler = async (req, res) => {
  const product = await ProductModel.findById(req.params.id);

  if (!product) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  // Delete all images from Cloudinary
  await Promise.all(product.images.map((img) => deleteImage(img.id)));

  await ProductModel.deleteOne({ _id: product._id });

  res.status(200).json({ message: "Product deleted successfully." });
};
