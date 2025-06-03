import express from "express";
import {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    getMentorRequests
} from "../controllers/admin.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

const router = express.Router();

// All admin routes require authentication
router.use(isAuthenticated);

// Dashboard routes
router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);
router.get("/mentor-requests", getMentorRequests);

export default router; 