import { catchAsync } from "../middleware/error.middleware.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Chat } from "../models/chat.model.js";
import { AppError } from "../middleware/error.middleware.js";
import { socketIdToUserId, getIO } from "../socket/socket.js";

export const sendMessage = catchAsync(async (req, res, next) => {
    const { content } = req.body; 
    const { chatId } = req.params;

    console.log("Chat ID:", chatId);
    console.log("Content:", content);

    if (!content || !chatId) {
        return next(new AppError("Content and chatId are required", 400));
    }
    if (content.length > 500) {
        return next(new AppError("Message content exceeds the maximum length of 500 characters", 400));
    }
    if (content.length < 1) {
        return next(new AppError("Message content must be at least 1 character long", 400));
    }
    const senderId = req.id;
    const sender = await User.findById(senderId);
    const chat = await Chat.findById(chatId);

    if (!sender || !chat) {
        return next(new AppError("Sender or chat not found", 404));
    }

    const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content
    });

    // Get the io instance using the getIO function
    const io = getIO();
    
    // Emit to all users in the chat room
    console.log('Emitting receiveMessage to chat room:', chatId, 'Message:', {
        _id: message._id,
        chatId,
        sender: {
            _id: sender._id,
            name: sender.name,
        },
        content: message.content,
        createdAt: message.createdAt,
        status: 'sent'
    });
    io.in(chatId).allSockets().then(sockets => {
      console.log(`Sockets in room ${chatId}:`, Array.from(sockets));
    });

    io.to(chatId).emit("receiveMessage", {
        _id: message._id,
        chatId,
        sender: {
            _id: sender._id,
            name: sender.name,
        },
        content: message.content,
        createdAt: message.createdAt,
        status: 'sent'
    });

    res.status(201).json({
        success: true,
        message: {
            _id: message._id,
            chatId,
            sender: {
                _id: sender._id,
                name: sender.name,
            },
            content: message.content,
            createdAt: message.createdAt,
            status: 'sent'
        }
    });
});

// controllers/messageController.js
export const getMessages = catchAsync(async (req, res, next) => {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
  
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email') 
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
 
    const totalMessages = await Message.countDocuments({ chat: chatId });
  
    res.status(200).json({
      success: true,
      results: messages.length,
      totalMessages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
      messages,
    });
  });

  export const getUnreadMessages = catchAsync(async (req, res, next) => {
    const { chatId } = req.params;
    const { id: userId } = req.user;
  
    const unreadMessages = await Message.find({
      chat: chatId,
      status: 'sent',
      sender: { $ne: userId },
    }).select("_id status createdAt sender");
  
    if (!unreadMessages.length) {
      return next(new AppError("No unread messages found for this chat", 404));
    }
  
    res.status(200).json({
      success: true,
      results: unreadMessages.length,
      unreadMessages, 
    })
  })

  export const markMessagesAsRead = catchAsync(async (req, res, next) => {
    const { chatId } = req.params;
    const { id: userId } = req.user;
  
    console.log("Marking messages as read for chat:", chatId);

    // Update message status
    const result = await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        status: "sent",
      },
      {
        $set: { status: "read" },
      }
    );
  
    // Emit event via WebSocket using getIO instead of req.io
    const io = getIO();
    io.to(chatId).emit("messagesRead", {
      chatId,
      userId,
    });
  
    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`,
    });
  });