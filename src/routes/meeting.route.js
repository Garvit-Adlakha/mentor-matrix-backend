// Routes to implement:
// - POST /api/v1/meetings - Create meeting
// - GET /api/v1/meetings - Get user's meetings
// - GET /api/v1/meetings/:id - Get specific meeting
// - PUT /api/v1/meetings/:id - Update meeting
// - DELETE /api/v1/meetings/:id - Delete meeting
// - PATCH /api/v1/meetings/:id/notes - Add meeting notes

// Notification types:
// - Meeting invitation
// - Meeting update
// - Meeting cancellation
// - Meeting reminder (24h before)
import {Router} from 'express';
import { isAuthenticated } from "../middleware/auth.middleware.js";
import { createMeeting, getMeetingById, getUserMeetings } from '../controllers/meeting.controller.js';


const router= Router();

router.post('/create/:projectId',isAuthenticated,createMeeting)

router.get('/',isAuthenticated, getUserMeetings);

router.get('/:meetingId',isAuthenticated, getMeetingById);

export default router;