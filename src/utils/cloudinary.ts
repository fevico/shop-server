import { v2 as cloudinary } from "cloudinary";
import { File } from "formidable";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryImage {
  url: string;
  id: string;
}

export const uploadImage = async (
  file: File,
  folder: string
): Promise<CloudinaryImage> => {
  const result = await cloudinary.uploader.upload(file.filepath, {
    folder,
    resource_type: "image",
  });
  return { url: result.secure_url, id: result.public_id };
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
