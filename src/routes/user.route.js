import express from "express";
import {
    authenticateUser,
    changeUserPassword,
    createUserAccount,
    createMentorAccount,
    deleteUserAccount,
    getCurrentUserProfile,
    signOutUser,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    getAllMentors,
    SearchMentor,
    getPendingMentors,
    verifyMentor
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";
import  { uploadAvatar } from "../utils/multer.js";
import { validateSignup, validateSignin, validatePasswordChange } from "../middleware/validation.middleware.js";

const router = express.Router();

// Auth routes
router.post("/signup", validateSignup, createUserAccount);
router.post("/mentor/signup", validateSignup, uploadAvatar, createMentorAccount);
router.post("/signin", validateSignin, authenticateUser);
router.post("/signout", signOutUser); // No authentication middleware for signout

// Profile routes
router.get("/profile", isAuthenticated, getCurrentUserProfile);
router.patch("/profile", isAuthenticated, uploadAvatar, updateUserProfile);

// Mentor routes
router.get('/mentor/search', isAuthenticated, SearchMentor);
router.get('/mentor', getAllMentors);
router.get('/mentor/pending', isAuthenticated, getPendingMentors);
router.patch('/mentor/verify/:id', isAuthenticated, verifyMentor);

// Password routes
router.patch("/change-password", isAuthenticated, validatePasswordChange, changeUserPassword);
router.delete("/account", isAuthenticated, deleteUserAccount);

// Forgot Password Route (validate email)
router.post(
    "/forgot-password",
    forgotPassword
);

// Reset Password Route (validate new password)
router.post(
    "/reset-password/:token",
    resetPassword
);

export default router;
