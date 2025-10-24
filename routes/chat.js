const express = require('express');
const Message = require('../models/Message');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat/room
// @desc    Create or get room between two users
// @access  Private
router.post('/room', auth, async (req, res) => {
  try {
    const { participantId } = req.body;
    
    if (!participantId) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot create room with yourself' });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Check if room already exists
    let room = await Room.findOne({
      roomType: 'private',
      participants: { $all: [req.user._id, participantId] }
    }).populate('participants', 'username email avatar isOnline');

    if (!room) {
      // Create new room
      room = new Room({
        participants: [req.user._id, participantId],
        roomType: 'private'
      });
      await room.save();
      await room.populate('participants', 'username email avatar isOnline');
    }

    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/rooms
// @desc    Get user's rooms
// @access  Private
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'username email avatar isOnline')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/messages/:roomId
// @desc    Get messages for a room
// @access  Private
router.get('/messages/:roomId', auth, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Check if user is participant of the room
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user._id
    });

    if (!room) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ roomId })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', auth, async (req, res) => {
  try {
    const { roomId, content, receiverId } = req.body;

    if (!roomId || !content) {
      return res.status(400).json({ message: 'Room ID and content are required' });
    }

    // Check if user is participant of the room
    const room = await Room.findOne({
      _id: roomId,
      participants: req.user._id
    });

    if (!room) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get receiver ID
    const receiver = room.participants.find(p => p.toString() !== req.user._id.toString());
    
    if (!receiver) {
      return res.status(400).json({ message: 'Invalid room' });
    }

    // Create message
    const message = new Message({
      sender: req.user._id,
      receiver: receiver,
      content,
      roomId
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    // Update room's last message
    room.lastMessage = message._id;
    await room.save();

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/messages/:messageId/read
// @desc    Mark message as read
// @access  Private
router.put('/messages/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      receiver: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

