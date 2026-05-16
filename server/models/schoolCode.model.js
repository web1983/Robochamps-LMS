import mongoose from "mongoose";

const schoolCodeSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: [true, "School name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "School code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: [true, "Student limit is required"],
      min: [1, "Limit must be at least 1"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

const SchoolCode =
  mongoose.models.SchoolCode || mongoose.model("SchoolCode", schoolCodeSchema);
export default SchoolCode;

