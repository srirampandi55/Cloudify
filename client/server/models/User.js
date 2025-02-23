import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      match: [/.+\@.+\..+/, "Please enter a valid email"], 
    },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

// 🔹 Hash Password Before Saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
