import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();
const router = express.Router();
router.use(cookieParser()); // Enable cookie parsing

// **🔹 User Registration**
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // ✅ Create new user (hashing happens in model)
    const newUser = new User({ username: name, email, password });
    await newUser.save();

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ Send token as HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.status(201).json({
      message: "User registered successfully",
      token, // ✅ Returning token in response
      user: { id: newUser._id, username: name, email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **🔹 User Login**
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    console.log("Entered Password:", password);
    console.log("Stored Hashed Password:", user.password);

    // ✅ Validate password using model method
    const isMatch = await user.matchPassword(password);
    console.log("Password Match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // ✅ Set token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.json({
      message: "Login successful",
      token, // ✅ Returning token in response
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// **🔹 Logout User**
router.post("/logout", (req, res) => {
  res.cookie("token", "", { expires: new Date(0) }); // ✅ Clear token
  res.json({ message: "Logged out successfully" });
});

// **🔹 Get User Profile (Protected Route)**
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;
