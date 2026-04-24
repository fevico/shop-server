import { Model, ObjectId, Schema, model } from "mongoose";
import { CloudinaryImage } from "@/utils/cloudinary";

export interface CategoryDoc {
  _id: ObjectId;
  name: string;
  description?: string;
  image?: CloudinaryImage;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String },
      id: { type: String },
    },
  },
  { timestamps: true }
);

const CategoryModel = model("Category", categorySchema);

export default CategoryModel as Model<CategoryDoc>;
