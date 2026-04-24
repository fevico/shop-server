import { Model, ObjectId, Schema, model } from "mongoose";

export interface UserDoc {
  _id: ObjectId;
  name?: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isVerified: boolean;
  orders?: ObjectId[];
}

const userSchema = new Schema<UserDoc>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    orders: [
      {
        type: Schema.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

const UserModel = model("User", userSchema);

export default UserModel as Model<UserDoc>;
