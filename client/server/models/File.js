import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    filePath: { type: String, required: true }, // Changed from fileUrl
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null }, // Folder reference
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // List of users who can access
    accessType: { 
      type: String, 
      enum: ["private", "public", "restricted"], 
      default: "private" 
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

export default mongoose.model("File", FileSchema);
