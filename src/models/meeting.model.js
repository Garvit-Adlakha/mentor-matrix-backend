import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Meeting title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project is required"],
        },
        scheduledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Meeting scheduler is required"],
        },
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        startTime: {
            type: Date,
            required: [true, "Start time is required"],
        },
        endTime: {
            type: Date,
            required: [true, "End time is required"],
        },
        location: {
            type: String,
            default: "Virtual",
            trim: true,
        },
        meetingLink: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ["scheduled", "cancelled", "completed", "rescheduled"],
            default: "scheduled",
        },
        meetingNotes: {
            type: String,
            default: "",
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
        roomName: {
            type: String,
        },
        
        recurring: {
            isRecurring: {
                type: Boolean,
                default: false,
            },
            frequency: {
                type: String,
                enum: ["daily", "weekly", "biweekly", "monthly"],
                default: "weekly",
            },
            endDate: {
                type: Date,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual for checking if meeting is upcoming
meetingSchema.virtual("isUpcoming").get(function () {
    return this.startTime > new Date();
});

// Virtual for meeting duration in minutes
meetingSchema.virtual("durationMinutes").get(function () {
    return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Pre-save validation to ensure end time is after start time
meetingSchema.pre("save", function (next) {
    if (this.endTime <= this.startTime) {
        const error = new Error("End time must be after start time");
        return next(error);
    }
    next();
});

// Index for efficient queries
meetingSchema.index({ projectId: 1, startTime: 1 });
meetingSchema.index({ participants: 1, startTime: 1 });
meetingSchema.index({ status: 1, startTime: 1 });

export const Meeting = mongoose.model("Meeting", meetingSchema);