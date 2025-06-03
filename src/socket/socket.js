// socket.js - WebSocket server with room management, rate limiting, and error handling
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import { User } from "../models/user.model.js";

const onlineUsers = new Map();
const userRooms = new Map(); // Store user-to-room mapping
const messageRateLimits = new Map(); // Store rate limits per user

// Helper to map socket.id to userId after authentication (for better security)

export const socketIdToUserId = new Map();
const userCache = new Map(); // Cache user details to avoid excessive DB lookups

// Create a global io variable to be exported and used in other modules
let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e7, // 10MB WebSocket Compression
  });

  // 1. Room Management Optimization
  // Use userId everywhere after authentication for consistency
  const addUserToRoom = (userId, chatId) => {
    if (!userRooms.has(userId)) {
      userRooms.set(userId, new Set());
    }
    userRooms.get(userId).add(chatId);
  };

  const removeUserFromRoom = (userId, chatId) => {
    userRooms.get(userId)?.delete(chatId);
    if (userRooms.get(userId)?.size === 0) {
      userRooms.delete(userId);
    }
  };

  // 2. Rate Limiting and Throttling
  const isRateLimited = (userId) => {
    const userLimit = messageRateLimits.get(userId) || { count: 0, timestamp: Date.now() };
    const currentTime = Date.now();
    const timeDiff = currentTime - userLimit.timestamp;

    if (timeDiff < 1000) {
      userLimit.count += 1;
      if (userLimit.count > 5) {
        return true; // Limit: 5 messages per second
      }
    } else {
      userLimit.count = 1;
      userLimit.timestamp = currentTime;
    }

    messageRateLimits.set(userId, userLimit);
    return false;
  };

  // 3. Error Handling and Acknowledgements
  const sendError = (socket, message, code = 'GENERIC_ERROR') => {
    socket.emit("error", { message, code });
  };

  // Helper function to get user details (with caching)
  const getUserDetails = async (userId) => {
    // Return from cache if available
    if (userCache.has(userId)) {
      return userCache.get(userId);
    }

    try {
      // Fetch from database
      const user = await User.findById(userId).select('name email avatar');
      if (user) {
        // Store in cache with 5-minute TTL
        userCache.set(userId, {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        });
        
        // Set cache expiry (5 minutes)
        setTimeout(() => {
          userCache.delete(userId);
        }, 5 * 60 * 1000);
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
  };

  // WebSocket Connection
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // Only use userId after authentication
    onlineUsers.set(socket.id, socket.id);
    socket.broadcast.emit("userOnline", socket.id);

    // Authenticate user and map socket.id to userId (JWT or session token)
    socket.on("authenticate", async ({ userId }) => {
      if (userId) {
        socketIdToUserId.set(socket.id, userId);
        onlineUsers.set(userId, socket.id);
        
        // Pre-cache user details on authentication
        await getUserDetails(userId);
      }
    });

    // Join Chat Room
    socket.on("joinChat", (chatId) => {
      const userId = socketIdToUserId.get(socket.id) || socket.id;
      socket.join(chatId);
      addUserToRoom(userId, chatId);
      console.log(`User ${userId} joined room ${chatId}`);
    });

    // Leave Chat Room
    socket.on("leaveChat", (chatId) => {
      const userId = socketIdToUserId.get(socket.id) || socket.id;
      socket.leave(chatId);
      removeUserFromRoom(userId, chatId);
      console.log(`User ${userId} left room ${chatId}`);
    });

    // Typing Indicators
    socket.on("typing", ({ chatId, userName }) => {
      socket.to(chatId).emit("typing", { chatId, userName });
    });
    socket.on("stopTyping", ({ chatId, userName }) => {
      socket.to(chatId).emit("stopTyping", { chatId, userName });
    });

    // 4. Emit Events Selectively
    socket.on("sendMessage", async ({ chatId, content }, callback) => {
      if (!chatId || !content) {
        return sendError(socket, "Chat ID and content are required.", 'MISSING_FIELDS');
      }

      // Use userId for rate limiting if authenticated, else fallback to socket.id
      const userId = socketIdToUserId.get(socket.id) || socket.id;
      if (isRateLimited(userId)) {
        return sendError(socket, "Rate limit exceeded. Please slow down.", 'RATE_LIMIT');
      }

      // Get user details to include with message
      const userDetails = await getUserDetails(userId);
      
      io.to(chatId).emit("receiveMessage", {
        chatId,
        senderId: userId,
        sender: userDetails || { _id: userId, name: "Unknown User" },
        content,
        createdAt: new Date(),
      });

      if (callback) callback({ success: true, message: "Message sent" });
    });

    // Mark Messages as Read
    socket.on("markMessagesRead", ({ chatId }) => {
      const userId = socketIdToUserId.get(socket.id) || socket.id;
      io.to(chatId).emit("messagesRead", {
        chatId,
        userId,
      });
    });

    // 5. Connection Reconnection Handling
    socket.on("reconnect_attempt", () => {
      console.log(`User attempting to reconnect: ${socket.id}`);
    });
    socket.on("reconnect", (attempt) => {
      console.log(`User reconnected: ${socket.id} after ${attempt} attempts`);
    });

    // 6. WebSocket Monitoring
    socket.on("pingServer", (callback) => {
      const serverTime = Date.now();
      if (callback) callback({ serverTime });
    });

    // On Disconnect - leave all rooms
    socket.on("disconnect", () => {
      const userId = socketIdToUserId.get(socket.id) || socket.id;
      if (userId) {
        onlineUsers.delete(userId);
        socketIdToUserId.delete(socket.id);
      }
      onlineUsers.delete(socket.id);
      userRooms.get(userId)?.forEach((room) => socket.leave(room));
      userRooms.delete(userId);
      socket.broadcast.emit("userOffline", userId);
      console.log("User disconnected:", userId);
    });

    // Error Handling
    socket.on("error", (err) => {
      console.error(`Error on socket: ${err.message}`);
    });
  });

  // Return the io instance so it can be properly used elsewhere
  return io;
};

// Export a function to get the io instance, ensuring it's always initialized first
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initializeSocket first.');
  }
  return io;
};

