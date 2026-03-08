import mongoose from "mongoose";

const trustedUserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    addedBy: { type: String, required: true }, // userId of whoever added them
    addedByUsername: { type: String, required: true },
  },
  { timestamps: true },
);

export const TrustedUser = mongoose.model("TrustedUser", trustedUserSchema);
