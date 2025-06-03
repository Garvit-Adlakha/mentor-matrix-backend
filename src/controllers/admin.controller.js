import { User } from "../models/user.model.js";
import { catchAsync, AppError } from "../middleware/error.middleware.js";

/**
 * Get admin dashboard statistics
 * @route GET /api/v1/admin/dashboard
 */
export const getDashboardStats = catchAsync(async (req, res) => {
    const [
        totalStudents,
        totalMentors,
        activeMentors,
        pendingMentors,
        rejectedMentors
    ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "mentor" }),
        User.countDocuments({ role: "mentor", status: "active" }),
        User.countDocuments({ role: "mentor", status: "pending" }),
        User.countDocuments({ role: "mentor", status: "rejected" })
    ]);

    res.status(200).json({
        success: true,
        stats: {
            totalStudents,
            totalMentors,
            activeMentors,
            pendingMentors,
            rejectedMentors
        }
    });
});

/**
 * Get all users with pagination and filters
 * @route GET /api/v1/admin/users
 */
export const getAllUsers = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const status = req.query.status;
    const search = req.query.search;

    const query = {
        role: { $ne: 'admin' } // Exclude admin users
    };

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

/**
 * Update user status
 * @route PATCH /api/v1/admin/users/:id/status
 */
export const updateUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
        throw new AppError("Invalid status. Must be 'active' or 'inactive'", 400);
    }

    const user = await User.findById(id);
    if (!user) {
        throw new AppError("User not found", 404);
    }

    user.status = status;
    await user.save();

    res.status(200).json({
        success: true,
        message: `User status updated to ${status}`,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
        }
    });
});

/**
 * Get mentor verification requests
 * @route GET /api/v1/admin/mentor-requests
 */
export const getMentorRequests = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "pending";

    const query = {
        role: "mentor",
        status
    };

    const mentors = await User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        mentors,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

