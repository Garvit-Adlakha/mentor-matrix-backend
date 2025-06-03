import jwt from "jsonwebtoken";
import { AppError, catchAsync } from "./error.middleware.js";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

export const isAuthenticated = catchAsync(async (req, res, next) => {
  // Only check for token in cookies for security
  const token = req.cookies?.token;

  if (!token) {
    throw new AppError("Authentication required. Please login to continue.", 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      throw new AppError("Your session has expired. Please login again.", 401);
    }
    
    // Find the user
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError("User associated with this token no longer exists.", 401);
    }
    
    // Check if user changed password after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTime = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (passwordChangedTime > decoded.iat) {
        throw new AppError("Password was recently changed. Please login again.", 401);
      }
    }

    // Check if user is active
    if (user.status === 'inactive') {
      throw new AppError("This account has been deactivated.", 401);
    }

    // Grant access to protected route
    req.user = user;
    req.id=user._id
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new AppError("Invalid authentication token. Please login again.", 401);
    }
    if (error.name === "TokenExpiredError") {
      throw new AppError("Your session has expired. Please login again.", 401);
    }
    throw error;
  }
});

// Role-based access control
export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required.", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("You do not have permission to perform this action.", 403);
    }
    next();
  });
};

// Middleware to check if user is the owner of a resource
export const isOwner = (model) => {
  return catchAsync(async (req, res, next) => {
    const resourceId = req.params.id;
    const resource = await model.findById(resourceId);
    
    if (!resource) {
      throw new AppError("Resource not found", 404);
    }
    
    // Check if the user is the owner of the resource
    if (resource.user && resource.user.toString() !== req.user._id.toString()) {
      throw new AppError("You do not have permission to perform this action on this resource", 403);
    }
    
    next();
  });
};
