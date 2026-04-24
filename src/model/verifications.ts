import { Model, ObjectId, Schema, model } from "mongoose";

export type VerificationType = "email" | "password";

export interface VerificationDoc {
  _id: ObjectId;
  userId: ObjectId;
  token: string;
  type: VerificationType;
  expiresAt: Date;
}

const verificationSchema = new Schema<VerificationDoc>({
  userId: {
    type: Schema.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["email", "password"],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB automatically deletes the document once expiresAt is reached
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VerificationModel = model("Verification", verificationSchema);

export default VerificationModel as Model<VerificationDoc>;
