import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    trim: true,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
}, {
  timestamps: true,        // Automatically manage createdAt & updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to format created date
messageSchema.virtual('createdTime').get(function () {
  return this.createdAt.toLocaleString();
});

export const Message = mongoose.model('Message', messageSchema);

