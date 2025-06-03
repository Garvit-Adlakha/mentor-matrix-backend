import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  isGroupChat: {
    type: Boolean,
    default: true, // ** Since all your chats are group-based **
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


chatSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chat',
  justOne: true,
  options: { sort: { createdAt: -1 } },
});

export const Chat = mongoose.model('Chat', chatSchema);
