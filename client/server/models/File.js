import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of users who can access
  accessType: { type: String, enum: ["private", "public", "restricted"], default: "private" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("File", FileSchema);
