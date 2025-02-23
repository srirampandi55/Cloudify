import fs from "fs";
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import crypto from "crypto";
import authMiddleware from "../middleware/authMiddleware.js";
import File from "../models/File.js";

dotenv.config();
const router = express.Router();
const uploadDir = process.env.UPLOAD_DIR || "uploads";

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// **🔹 Multer Storage Configuration**
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userFolder = `${uploadDir}/${req.user.id}`;
    if (!fs.existsSync(userFolder)) fs.mkdirSync(userFolder, { recursive: true });
    cb(null, userFolder);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomBytes(10).toString("hex") + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// **🔹 File Type Restriction**
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type"), false);
};

const upload = multer({ storage, fileFilter });

// **🔹 Upload File API (🔐 Protected)**
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const file = new File({
      filename: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      fileUrl: `/uploads/${req.user.id}/${req.file.filename}`,
      uploadedBy: req.user.id
    });

    await file.save();
    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (err) {
    res.status(500).json({ message: "Error uploading file", error: err.message });
  }
});

// **🔹 Get Files for Logged-in User**
router.get("/my-files", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user.id });
    res.json({ files });
  } catch (err) {
    res.status(500).json({ message: "Error fetching files", error: err.message });
  }
});

// **🔹 Rename File API (User must own the file)**
router.put("/rename/:id", authMiddleware, async (req, res) => {
  try {
    const { newFilename } = req.body;
    if (!newFilename) return res.status(400).json({ message: "New filename is required" });

    const file = await File.findById(req.params.id);
    if (!file || file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const oldPath = `${uploadDir}/${req.user.id}/${file.filename}`;
    const newPath = `${uploadDir}/${req.user.id}/${newFilename}`;

    if (!fs.existsSync(oldPath)) return res.status(400).json({ message: "File does not exist on server" });

    fs.renameSync(oldPath, newPath);
    file.filename = newFilename;
    file.fileUrl = `/uploads/${req.user.id}/${newFilename}`;
    await file.save();

    res.json({ message: "File renamed successfully", file });
  } catch (err) {
    res.status(500).json({ message: "Error renaming file", error: err.message });
  }
});

// **🔹 Delete File API (Only Owner)**
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const filePath = `${uploadDir}/${req.user.id}/${file.filename}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await file.deleteOne();
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting file", error: err.message });
  }
});

// **🔹 Move File API (Only Owner)**
router.put("/move/:id", authMiddleware, async (req, res) => {
  try {
    const { newFolder } = req.body;
    if (!newFolder) return res.status(400).json({ message: "New folder name is required" });

    const file = await File.findById(req.params.id);
    if (!file || file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const folderPath = `${uploadDir}/${req.user.id}/${newFolder}`;
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    const oldPath = `${uploadDir}/${req.user.id}/${file.filename}`;
    const newPath = `${folderPath}/${file.filename}`;

    if (!fs.existsSync(oldPath)) return res.status(400).json({ message: "File does not exist on server" });

    fs.renameSync(oldPath, newPath);
    file.fileUrl = `/uploads/${req.user.id}/${newFolder}/${file.filename}`;
    await file.save();

    res.json({ message: "File moved successfully", file });
  } catch (err) {
    res.status(500).json({ message: "Error moving file", error: err.message });
  }
});

// **🔹 Generate Shareable Link API**
router.post("/share/:id", authMiddleware, async (req, res) => {
  try {
    const { accessType, sharedWith } = req.body;
    const file = await File.findById(req.params.id);
    if (!file || file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const shareToken = crypto.randomBytes(16).toString("hex");
    file.accessType = accessType;
    if (accessType === "restricted") file.sharedWith = sharedWith;
    file.shareToken = shareToken;
    await file.save();

    res.json({ message: "Shareable link generated", link: `${process.env.SERVER_URL}/api/files/access/${file._id}?token=${shareToken}` });
  } catch (err) {
    res.status(500).json({ message: "Error generating shareable link", error: err.message });
  }
});

// **🔹 Access Shared File API**
router.get("/access/:id", async (req, res) => {
  try {
    const { token } = req.query;
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.accessType === "restricted" && file.shareToken !== token) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json({ file });
  } catch (err) {
    res.status(500).json({ message: "Error accessing file", error: err.message });
  }
});

export default router;
