import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const authMiddleware = async (req, res, next) => {
  let token = req.header("Authorization");

  // 🔹 Check if token exists
  if (!token || !token.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided, authorization denied" });
  }

  try {
    token = token.split(" ")[1]; // Extract token after "Bearer"

    // 🔹 Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Find user in database (Exclude password)
    const user = await User.findById(decoded.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ message: "User not found, invalid token" });
    }

    req.user = user; // Attach user data to request object
    next(); // Proceed to the next middleware

  } catch (error) {
    console.error("❌ Token verification failed:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
