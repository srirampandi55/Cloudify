import express from "express";
import fs from "fs";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// **🔹 Create Folder API (🔐 Protected & User-Specific)**
router.post("/create", authMiddleware, (req, res) => {
  const { folderName } = req.body;

  // ✅ Validate folder name
  if (!folderName || typeof folderName !== "string") {
    return res.status(400).json({ message: "Invalid folder name" });
  }

  // 🔹 User-specific folder path
  const userFolder = `uploads/${req.user.id}/${folderName}`;

  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
    res.json({ message: "Folder created successfully", folderPath: userFolder });
  } else {
    res.status(400).json({ message: "Folder already exists" });
  }
});

export default router;
