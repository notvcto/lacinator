import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    questionId: {
      // Short human-readable ID e.g. #42 — assigned at creation via Counter
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
    addedBy: {
      // Discord user ID of whoever submitted it
      type: String,
      required: true,
    },
    addedByUsername: {
      type: String,
      required: true,
    },
    rating: {
      type: String,
      enum: ["PG", "PG-13", "R"],
      default: "PG",
    },
    active: {
      // Soft-delete support — set to false instead of dropping the doc
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for fast random pulls per type
questionSchema.index({ type: 1, active: 1 });

export const Question = mongoose.model("Question", questionSchema);
