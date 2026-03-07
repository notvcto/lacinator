import mongoose from "mongoose";
import { Counter } from "./Counter.js";

const andiQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: Number,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["truth", "dare", "nhie", "wyr"],
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    rating: {
      type: String,
      enum: ["PG", "PG-13", "R"],
      default: "PG",
    },
    addedBy: { type: String, required: true },
    addedByUsername: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

andiQuestionSchema.index({ type: 1, active: 1 });

// Use a separate counter key so IDs don't collide with the main pool
andiQuestionSchema.statics.nextId = () => Counter.nextValue("andiQuestionId");

export const AndiQuestion = mongoose.model("AndiQuestion", andiQuestionSchema);
