import { Model, ObjectId, Schema, model } from "mongoose";
import { CloudinaryImage } from "@/utils/cloudinary";

export interface ProductDoc {
  _id: ObjectId;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category: ObjectId;
  images: CloudinaryImage[];
  isActive: boolean;
}

const productSchema = new Schema<ProductDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: Schema.ObjectId,
      ref: "Category",
      required: true,
    },
    images: [
      {
        url: { type: String, required: true },
        id: { type: String, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const ProductModel = model("Product", productSchema);

export default ProductModel as Model<ProductDoc>;
