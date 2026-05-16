import User from "../models/user.model.js";
import SchoolCode from "../models/schoolCode.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia, extractPublicId } from "../utils/cloudinary.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { name, email, password, schoolCode, category } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: "School code is required.",
      });
    }

    const normalizedCode = schoolCode.trim().toUpperCase();

    let reservedSchoolCode = null;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      reservedSchoolCode = await SchoolCode.findOneAndUpdate(
        {
          code: normalizedCode,
          isActive: true,
          $expr: { $lt: ["$usedCount", "$limit"] },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (!reservedSchoolCode) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid school code or maximum registrations reached for this code.",
        });
      }

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        category: category || "grade_3_5_basic",
        school: reservedSchoolCode.schoolName,
        schoolCode: reservedSchoolCode.code,
      });

      return res.status(201).json({
        success: true,
        message: "Account created successfully.",
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          photoUrl: newUser.photoUrl,
          enrolledCourses: newUser.enrolledCourses,
          category: newUser.category,
        },
      });
    } catch (error) {
      if (reservedSchoolCode?._id) {
        await SchoolCode.findByIdAndUpdate(reservedSchoolCode._id, {
          $inc: { usedCount: -1 },
        });
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect email or password",
      });
    }

    // Update last login and active status
    user.lastLogin = new Date();
    user.isActive = true;
    await user.save();

    // ✅ Generate token
    return generateToken(res, user, `Welcome back ${user.name}`);
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Set user as inactive on logout
    if (req.id) {
      await User.findByIdAndUpdate(req.id, { isActive: false });
    }
    
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out Successfully.",
      success: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to logout",
    });
  }
}

export const getUserProfile = async (req,res) => {
    try {
      const userId = req.id;
      const user = await User.findById(userId).select("-password");
      if(!user){
        return res.status(404).json({
          message:"profile not found",
          success:false
        })
      }
      return res.status(200).json({
        success:true,
        user
      })
    } catch (error) {
       console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user.",
    });
    }
}


export const updateProfile = async (req, res) => {
  try {
    const userId = req.id;
    const { name } = req.body;
    const profilePhoto = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false
      })
    }

    let photoUrl = user.photoUrl; // Keep existing photo URL by default

    // If new photo is uploaded
    if (profilePhoto) {
      // Delete old photo from cloudinary if it exists
      if (user.photoUrl) {
        const publicId = extractPublicId(user.photoUrl);
        if (publicId) {
          await deleteMediaFromCloudinary(publicId);
          console.log("Old profile photo deleted:", publicId);
        }
      }

      // Upload new photo (use buffer for serverless, path for local)
      const cloudResponse = await uploadMedia(profilePhoto.buffer || profilePhoto.path);
      photoUrl = cloudResponse.secure_url;
    }

    const updateData = { name, photoUrl }
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully."
    })

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
}

// Update drive link
export const updateDriveLink = async (req, res) => {
  try {
    const userId = req.id;
    const { driveLink } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false
      });
    }

    // Validate that user is a student
    if (user.role !== 'student') {
      return res.status(403).json({
        message: "Only students can update drive links.",
        success: false
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { driveLink: driveLink || "" }, 
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: "Drive link updated successfully."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update drive link.",
    });
  }
}

// Get all students with drive links (for admin, with filtering)
export const getStudentsWithVideos = async (req, res) => {
  try {
    const { school, category, search } = req.query;

    // Build query
    let query = { role: "student" };

    // Filter by school
    if (school && school !== 'all') {
      query.school = { $regex: school, $options: 'i' };
    }

    // Filter by category (grade)
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by name or email
    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      students,
      count: students.length
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students with videos.",
    });
  }
}

// Create student user by admin
export const createStudentUser = async (req, res) => {
  try {
    const { name, email, password, category, school, schoolCode } = req.body;

    if (!name || !email || !password || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let reservedSchoolCode = null;

    if (schoolCode) {
      const normalizedCode = schoolCode.trim().toUpperCase();
      reservedSchoolCode = await SchoolCode.findOneAndUpdate(
        {
          code: normalizedCode,
          isActive: true,
          $expr: { $lt: ["$usedCount", "$limit"] },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      );

      if (!reservedSchoolCode) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid school code or maximum registrations reached for this code.",
        });
      }
    }

    // Create new student user
    try {
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "student",
        category: category,
        school:
          reservedSchoolCode?.schoolName || school || "",
        schoolCode: reservedSchoolCode?.code || "",
      });

      return res.status(201).json({
        success: true,
        message: "Student user created successfully",
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
        credentials: {
          email: email,
          password: password,
        },
      });
    } catch (error) {
      if (reservedSchoolCode?._id) {
        await SchoolCode.findByIdAndUpdate(reservedSchoolCode._id, {
          $inc: { usedCount: -1 },
        });
      }
      throw error;
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "student" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get users",
    });
  }
};

// Update user by admin
export const updateUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, category, school, resetPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) {
      // Check if email already exists for another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      user.email = email;
    }
    if (category) user.category = category;
    if (school !== undefined) user.school = school;
    
    // Reset password if provided
    if (resetPassword && resetPassword.trim() !== "") {
      if (resetPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      const hashedPassword = await bcrypt.hash(resetPassword, 10);
      user.password = hashedPassword;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        category: user.category,
        school: user.school,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// ================= DELETE USER BY ADMIN =================
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (req.id === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prevent deleting instructor accounts from manage users (only students can be deleted)
    if (user.role === "instructor") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete instructor accounts from here. Use instructor management.",
      });
    }

    // Delete user's profile photo from cloudinary if exists
    if (user.photoUrl) {
      try {
        const publicId = extractPublicId(user.photoUrl);
        await deleteMediaFromCloudinary(publicId);
      } catch (error) {
        console.log("Error deleting profile photo:", error);
        // Continue with user deletion even if photo deletion fails
      }
    }

    if (user.schoolCode) {
      try {
        const schoolCodeDoc = await SchoolCode.findOne({
          code: user.schoolCode,
        });
        if (schoolCodeDoc && schoolCodeDoc.usedCount > 0) {
          schoolCodeDoc.usedCount -= 1;
          await schoolCodeDoc.save();
        }
      } catch (error) {
        console.log("Failed to decrement school code usage:", error);
      }
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// ================= INSTRUCTOR MANAGEMENT =================

// Get all instructors
export const getAllInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: "instructor" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      instructors,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch instructors",
      error: error.message,
    });
  }
};

// Create new instructor
export const createInstructor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create instructor
    const instructor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "instructor",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Instructor created successfully",
      instructor: {
        _id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        role: instructor.role,
        createdAt: instructor.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create instructor",
      error: error.message,
    });
  }
};

// Update instructor password
export const updateInstructorPassword = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (instructor.role !== "instructor") {
      return res.status(400).json({
        success: false,
        message: "User is not an instructor",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    instructor.password = hashedPassword;
    await instructor.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

// Delete instructor
export const deleteInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Prevent admin from deleting themselves
    if (req.id === instructorId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    const instructor = await User.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (instructor.role !== "instructor") {
      return res.status(400).json({
        success: false,
        message: "User is not an instructor",
      });
    }

    // Delete instructor's profile photo if exists
    if (instructor.photoUrl) {
      try {
        const publicId = extractPublicId(instructor.photoUrl);
        await deleteMediaFromCloudinary(publicId);
      } catch (error) {
        console.log("Error deleting profile photo:", error);
      }
    }

    await User.findByIdAndDelete(instructorId);

    return res.status(200).json({
      success: true,
      message: "Instructor deleted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete instructor",
      error: error.message,
    });
  }
};

// ================= FORGOT PASSWORD =================

// Request password reset OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry to 10 minutes from now
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to user
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    await user.save();

    // Send email with OTP
    await sendPasswordResetEmail(user.email, otp, user.name);

    console.log(`✅ OTP sent to ${user.email}: ${otp}`);

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send password reset email",
      error: error.message,
    });
  }
};

// Verify OTP and reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists
    if (!user.resetPasswordOTP) {
      return res.status(400).json({
        success: false,
        message: "No password reset request found. Please request a new OTP",
      });
    }

    // Check if OTP has expired
    if (new Date() > user.resetPasswordOTPExpiry) {
      // Clear expired OTP
      user.resetPasswordOTP = null;
      user.resetPasswordOTPExpiry = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one",
      });
    }

    // Verify OTP
    if (user.resetPasswordOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpiry = null;
    await user.save();

    console.log(`✅ Password reset successful for ${user.email}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message,
    });
  }
};