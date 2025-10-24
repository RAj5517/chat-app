const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  roomType: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  roomName: {
    type: String,
    default: ''
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create a unique room ID for private chats
roomSchema.pre('save', function(next) {
  if (this.roomType === 'private' && this.participants.length === 2) {
    // Sort participants to ensure consistent room ID
    this.participants.sort();
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);

