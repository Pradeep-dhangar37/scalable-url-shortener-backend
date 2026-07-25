import mongoose from "mongoose";

const UrlSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  longUrl: {
    type: String,
    required: true,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  topic: {
    type: String,
    default: "General",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Url", UrlSchema);