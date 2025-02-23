import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import folderRoutes from "./routes/Folder.js"; 
import fileRoutes from "./routes/file.js";

// **🔹 Load Environment Variables**
dotenv.config();

const app = express();

// **🔹 Define `__dirname` for ES Modules**
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// **🔹 Security & Performance Middleware**
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// **🔹 Rate Limiting**
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit increased
  message: "Too many requests, please try again later.",
});
app.use(limiter);

// **🔹 CORS Configuration**
const allowedOrigins = [
  "http://localhost:3000",
  "http://yourfrontend.com", // Replace with actual production domain
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Policy Blocked This Request"));
      }
    },
    credentials: true,
  })
);

app.options("*", cors());

// **🔹 Serve Static Files (Uploads)**
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ Fixed `__dirname` issue

// **🔹 API Routes**
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);

// **🔹 Root Route**
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// **🔹 MongoDB Connection**
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};
connectDB();

// **🔹 Global Error Handling**
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

// **🔹 Graceful Shutdown on Server Exit**
process.on("SIGINT", async () => {
  console.log("🔻 Shutting down server...");
  await mongoose.disconnect();
  process.exit(0);
});

// **🔹 Start Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
