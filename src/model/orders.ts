import { Model, ObjectId, Schema, model } from "mongoose";

export interface OrderItem {
  productId: ObjectId;
  price: number;
  quantity: number;
}

export type OrderStatus = "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderDoc {
  _id: ObjectId;
  userId: ObjectId;
  orderItems: OrderItem[];  
  reference: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress?: {
    fullName: string;
    address: string;
    city: string;
  };
}
    
const orderSchema = new Schema<OrderDoc>(
  {
    userId: {
      type: Schema.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [
      {
        productId: {
          type: Schema.ObjectId,
          ref: "Product",
          required: true,
        },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      fullName: { type: String },
      address: { type: String },
      city: { type: String },
    },
  },
  { timestamps: true }
);

const OrderModel = model("Order", orderSchema);

export default OrderModel as Model<OrderDoc>;
