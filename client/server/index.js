import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import folderRoutes from "./routes/Folder.js";
import fileRoutes from "./routes/file.js";

dotenv.config();
const app = express();

// **🔹 Security Middleware**
app.use(helmet()); // Security headers
app.use(compression()); // Compress response bodies
app.use(express.json({ limit: "10mb" })); // Limit JSON payload size

// **🔹 Rate Limiting**
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later.",
});
app.use(limiter);


const allowedOrigins = [
  "http://localhost:3000", // ✅ Development
  "http://yourfrontend.com", // ✅ Production (Replace with actual domain)
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


app.use("/uploads", express.static(path.join(path.resolve(), "uploads")));


app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/folders", folderRoutes);

// **🔹 Root Route**
app.get("/", (req, res) => {
  res.send("API is running...");
});

// **🔹 MongoDB Connection with Error Handling**
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout if DB is unreachable
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // Stop server if DB connection fails
  });

// **🔹 Global Error Handling**
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
});

// **🔹 Graceful Server Shutdown**
process.on("SIGINT", async () => {
  console.log("🔻 Shutting down server...");
  await mongoose.disconnect();
  process.exit(0);
});

// **🔹 Start Server**
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
