import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
});

/**
 * Atomically increment and return the next value for a named counter.
 * Creates the counter if it doesn't exist yet.
 */
counterSchema.statics.nextValue = async function (name) {
  const doc = await this.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  );
  return doc.value;
};

export const Counter = mongoose.model("Counter", counterSchema);
