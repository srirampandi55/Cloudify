import express from "express";
import fs from "fs";

const router = express.Router();

// **🔹 Create Folder API**
router.post("/create", (req, res) => {
  const { folderName } = req.body;
  const folderPath = `uploads/${folderName}`;

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    res.json({ message: "Folder created successfully" });
  } else {
    res.status(400).json({ message: "Folder already exists" });
  }
});

export default router;
