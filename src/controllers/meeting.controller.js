// Functions to implement:
// - createMeeting: Create a new meeting
// - getAllMeetings: Get all meetings for a user
// - getMeetingById: Get a specific meeting
// - updateMeeting: Update meeting details
// - deleteMeeting: Cancel/delete a meeting
// - addMeetingNotes: Add notes after a meeting
import { AppError, catchAsync } from "../middleware/error.middleware.js";
import { sendEmail } from "../utils/sendEmail.js";
import { Project } from "../models/project.model.js";
import { Meeting } from "../models/meeting.model.js";
import mongoose from "mongoose";


export const createMeeting = catchAsync(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.id;

    // Validate required fields
    const { title, description, startTime, endTime, location } = req.body;
    if (!title || !startTime || !endTime) {
        return res.status(400).json({
            status: "fail",
            message: "Title, startTime, and endTime are required."
        });
    }
    if (new Date(startTime) >= new Date(endTime)) {
        return res.status(400).json({
            status: "fail",
            message: "startTime must be before endTime."
        });
    }
    if (new Date(startTime) < new Date()) {
        return res.status(400).json({
            status: "fail",
            message: "Meeting cannot be scheduled in the past."
        });
    }

    // Fetch project and validate
    const project = await Project.findById(projectId).select("teamMembers title");
    if (!project) {
      throw new AppError(404, "Project not found");
    }

    // Ensure unique participants
    const participantsSet = new Set([
        ...project.teamMembers.map(id => id.toString()),
        userId
    ]);
    const participants = Array.from(participantsSet);

    // Generate Jitsi meeting link
    const jitsiRoom = `MentorMatrix-${project.title}-${projectId}-${Date.now()}`;
    const meetingLink = `https://meet.jit.si/${jitsiRoom}`;

    const meeting = {
        title,
        description,
        projectId,
        scheduledBy: userId,
        participants,
        startTime,
        endTime,
        location,
        meetingLink,
        roomName: jitsiRoom,
    };
    const meetingCreated = await Meeting.create(meeting);
    const meetingDetails = await Meeting.findById(meetingCreated._id)
        .populate("participants", "name email")
        .populate("scheduledBy", "name email")
        .populate("projectId", "title");

    // Send email notification
    for (const participant of meetingDetails.participants) {
        const emailData = {
            email: participant.email,
            subject: `Meeting Scheduled for ${project.title}`,
            message: `<p>Hello ${participant.name},</p>
                <p>A meeting has been scheduled for the project "${project.title}".</p>
                <h3>Details:</h3>
                <ul>
                    <li><strong>Title:</strong> ${meetingDetails.title}</li>
                    <li><strong>Description:</strong> ${meetingDetails.description || 'N/A'}</li>
                    <li><strong>Start Time:</strong> ${new Date(meetingDetails.startTime).toLocaleString()}</li>
                    <li><strong>End Time:</strong> ${new Date(meetingDetails.endTime).toLocaleString()}</li>
                    <li><strong>Location:</strong> ${meetingDetails.location || 'Online'}</li>
                    <li><strong>Meeting Link:</strong> <a href="${meetingDetails.meetingLink}">${meetingDetails.meetingLink}</a></li>
                </ul>
                <p>Best regards,<br>MentorMatrix Team</p>`,
            textMessage: `Hello ${participant.name},\n\nA meeting has been scheduled for the project "${project.title}".\n\nDetails:\nTitle: ${meetingDetails.title}\nDescription: ${meetingDetails.description || 'N/A'}\nStart Time: ${new Date(meetingDetails.startTime).toLocaleString()}\nEnd Time: ${new Date(meetingDetails.endTime).toLocaleString()}\nLocation: ${meetingDetails.location || 'Online'}\nMeeting Link: ${meetingDetails.meetingLink}\n\nBest regards,\nMentorMatrix Team`
        };
        await sendEmail(emailData);
    }

    res.status(201).json({
        status: "success",
        message: "Meeting created successfully",
        data: {
            meeting: meetingDetails
        }
    });
});

export const getUserMeetings = catchAsync(async (req, res, next) => {
    const userId = req.id;
    const { status, page = 1, limit = 10, sort = "-startTime" } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query = {
        $or: [
            { scheduledBy: { $eq: userObjectId } },
            { participants: { $eq: userObjectId } }
        ]
    };
    const now = new Date();
    if (status === 'upcoming') {
        query.startTime = { $gte: now };
    } else if (status === 'past') {
        query.endTime = { $lt: now };
    } else if (status) {
        query.status = status;
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const meetings = await Meeting.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("participants", "name email")
        .populate("scheduledBy", "name email")
        .populate("projectId", "title");
    const total = await Meeting.countDocuments(query);
    res.status(200).json({
        status: "success",
        data: {
            meetings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        }
    });
});


export const getMeetingById = catchAsync(async (req, res, next) => {
    const { meetingId } = req.params;
    const userId = req.id;

    console.log("Meeting ID:", meetingId);

    // Validate meeting ID
    if (!mongoose.Types.ObjectId.isValid(meetingId)) {
        return res.status(400).json({
            status: "fail",
            message: "Invalid meeting ID."
        });
    }

    // Fetch meeting details
    const meeting = await Meeting.findById(meetingId)
        .populate("participants", "name email")
        .populate("scheduledBy", "name email")
        .populate("projectId", "title");

  
    res.status(200).json({
        status: "success",
        data: {
            meeting
        }
    });
}
);
