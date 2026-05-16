import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["instructor", "student"],
      default: "student",
    },
    category: {
      type: String,
      enum: ["grade_3_5_basic", "grade_6_8_basic", "grade_9_12_basic", "grade_3_5_advance", "grade_6_8_advance", "grade_9_12_advance"],
      default: "grade_3_5_basic",
    },
    school: {
      type: String,
      default: "",
      trim: true,
    },
    schoolCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    enrolledCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course", // make sure you create Course model later
      },
    ],
    photoUrl: {
      type: String,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    resetPasswordOTP: {
      type: String,
      default: null,
    },
    resetPasswordOTPExpiry: {
      type: Date,
      default: null,
    },
    driveLink: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Default export so you can use: import User from "../models/user.model.js";
const User = mongoose.model("User", userSchema);
export default User;
