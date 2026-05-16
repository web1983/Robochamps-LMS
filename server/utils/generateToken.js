import jwt from "jsonwebtoken";

export const generateToken = (res, user, message) => {
  const secret =
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev_jwt_secret_change_me" : undefined);

  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }

  const token = jwt.sign({ userId: user._id }, secret, {
    expiresIn: "7d",
  });

  // Cookie settings for same-domain deployment
  const isProduction = process.env.NODE_ENV === "production";
  
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction, // true in production (HTTPS)
    sameSite: "lax", // "lax" for same-domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl,
      enrolledCourses: user.enrolledCourses,
    },
    token, // optional, if you want frontend to also store it
  });
};
