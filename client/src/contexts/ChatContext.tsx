import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { User, Room, Message, ChatContextType } from '../types';
import { useAuth } from './AuthContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const currentRoomRef = useRef<Room | null>(null);

  // Update ref whenever currentRoom changes
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const socketUrl = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      console.log('Connecting to socket:', socketUrl);
      const newSocket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        forceNew: true
      });
      setSocket(newSocket);

      // Socket connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        console.log('✅ Socket transport:', newSocket.io.engine.transport.name);
        console.log('✅ Socket ready for real-time messaging');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      });

      // Fetch initial data
      fetchRooms();
      fetchUsers();

      // Socket event listeners
      newSocket.on('receive-message', (message: Message) => {
        console.log('✅ Received real-time message:', message);
        console.log('✅ Current room ID:', currentRoomRef.current?._id);
        console.log('✅ Message room ID:', message.roomId);
        console.log('✅ Message content:', message.content);
        
        // Update rooms list to show new message and move to top
        setRooms(prev => {
          const updatedRooms = prev.map(room => 
            room._id === message.roomId 
              ? { ...room, lastMessage: message, updatedAt: new Date().toISOString() }
              : room
          );
          
          // Move the room with new message to the top
          const roomWithNewMessage = updatedRooms.find(room => room._id === message.roomId);
          if (roomWithNewMessage) {
            const otherRooms = updatedRooms.filter(room => room._id !== message.roomId);
            return [roomWithNewMessage, ...otherRooms];
          }
          
          return updatedRooms;
        });
        
        // Add message to current room if it's the active room
        if (currentRoomRef.current && currentRoomRef.current._id === message.roomId) {
          console.log('✅ Adding message to current room - REAL-TIME UPDATE');
          setMessages(prev => {
            console.log('🔄 Before adding message - Current messages:', prev.length);
            console.log('🔄 Message to add:', message);
            
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg._id === message._id || 
              (msg.content === message.content && msg.createdAt === message.createdAt));
            if (exists) {
              console.log('⚠️ Message already exists, skipping');
              return prev;
            }
            
            const newMessages = [...prev, message];
            console.log('✅ Message added to current room - New count:', newMessages.length);
            console.log('✅ New messages array:', newMessages);
            return newMessages;
          });
        } else {
          console.log('⚠️ Message not for current room, will be loaded when room is opened');
        }
      });

      newSocket.on('user-online', (userId: string) => {
        console.log('User came online:', userId);
        setUsers(prev => prev.map(user => 
          user.id === userId || user._id === userId 
            ? { ...user, isOnline: true }
            : user
        ));
      });

      newSocket.on('user-offline', (userId: string) => {
        console.log('User went offline:', userId);
        setUsers(prev => prev.map(user => 
          user.id === userId || user._id === userId 
            ? { ...user, isOnline: false }
            : user
        ));
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  useEffect(() => {
    if (currentRoom && socket) {
      // Join room
      console.log('🔄 Joining room:', currentRoom._id);
      console.log('🔄 Socket connected:', socket.connected);
      socket.emit('join-room', currentRoom._id);
      console.log('✅ Joined room:', currentRoom._id);
      
      // Fetch messages for current room
      fetchMessages(currentRoom._id);

      return () => {
        console.log('🔄 Leaving room:', currentRoom._id);
        socket.emit('leave-room', currentRoom._id);
        console.log('✅ Left room:', currentRoom._id);
      };
    }
  }, [currentRoom, socket]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/chat/rooms');
      const roomsData = response.data;
      
      // Clean up duplicate rooms - keep only the most recent room between any two users
      const cleanedRooms = cleanDuplicateRooms(roomsData);
      setRooms(cleanedRooms);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanDuplicateRooms = (roomsData: Room[]) => {
    const currentUserId = user?.id || user?._id;
    const roomMap = new Map();
    
    roomsData.forEach(room => {
      if (room.roomType !== 'private' || room.participants.length !== 2) {
        // Keep group rooms and invalid private rooms as-is
        roomMap.set(room._id, room);
        return;
      }
      
      // Create a unique key for the two participants
      const participants = room.participants.map(p => p.id || p._id).sort();
      const roomKey = participants.join('-');
      
      if (!roomMap.has(roomKey)) {
        roomMap.set(roomKey, room);
      } else {
        // Keep the room with the most recent activity
        const existingRoom = roomMap.get(roomKey);
        const existingDate = new Date(existingRoom.updatedAt || existingRoom.createdAt);
        const currentDate = new Date(room.updatedAt || room.createdAt);
        
        if (currentDate > existingDate) {
          roomMap.set(roomKey, room);
        }
      }
    });
    
    return Array.from(roomMap.values());
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/users');
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    try {
      const response = await axios.get(`/chat/messages/${roomId}`);
      setMessages(response.data);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (content: string, roomId: string) => {
    if (!socket || !user) {
      console.error('❌ Cannot send message - socket or user not available');
      console.error('Socket:', socket);
      console.error('User:', user);
      return;
    }

    try {
      console.log('📤 Sending message:', content, 'to room:', roomId);
      console.log('📤 Socket connected:', socket.connected);
      console.log('📤 Socket ID:', socket.id);
      
      const response = await axios.post('/chat/messages', {
        roomId,
        content
      });

      const message = response.data;
      console.log('📤 Message sent successfully:', message);
      console.log('📤 Message sender ID:', message.sender.id || message.sender._id);
      console.log('📤 Current user ID:', user.id || user._id);
      console.log('📤 Message sender username:', message.sender.username);
      console.log('📤 Current user username:', user.username);
      
      // Add message to local state immediately
      setMessages(prev => {
        console.log('📤 Adding message to local state');
        return [...prev, message];
      });
      
      // Update rooms list with new message
      setRooms(prev => prev.map(room => 
        room._id === roomId 
          ? { ...room, lastMessage: message, updatedAt: new Date().toISOString() }
          : room
      ));
      
      // Emit message through socket for real-time delivery to other users
      console.log('📤 Emitting message via socket to room:', roomId);
      console.log('📤 Socket connected:', socket.connected);
      socket.emit('send-message', {
        roomId,
        message
      });
      console.log('✅ Message emitted via socket');
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const createRoom = async (participantId: string) => {
    try {
      console.log('🔍 Checking for existing room with participantId:', participantId);
      
      // First, check if a room already exists with this participant
      const currentUserId = user?.id || user?._id;
      const existingRoom = rooms.find(room => {
        if (room.roomType !== 'private') return false;
        
        // Check if this room has exactly 2 participants: current user and the selected participant
        if (room.participants.length !== 2) return false;
        
        const hasCurrentUser = room.participants.some(p => {
          const participantId = p.id || p._id;
          return participantId === currentUserId;
        });
        
        const hasSelectedUser = room.participants.some(p => {
          const pId = p.id || p._id;
          return pId === participantId;
        });
        
        return hasCurrentUser && hasSelectedUser;
      });
      
      if (existingRoom) {
        console.log('✅ Found existing room:', existingRoom._id);
        console.log('🔄 Opening existing room instead of creating new one');
        setCurrentRoom(existingRoom);
        return;
      }
      
      console.log('📝 No existing room found, creating new room with participantId:', participantId);
      const response = await axios.post('/chat/room', {
        participantId
      });
      
      const newRoom = response.data;
      console.log('✅ New room created:', newRoom._id);
      setRooms(prev => [newRoom, ...prev]);
      setCurrentRoom(newRoom);
    } catch (error: any) {
      console.error('❌ Error creating room:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  };

  const searchUsers = async (query: string) => {
    try {
      const response = await axios.get(`/users/search?q=${query}`);
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error searching users:', error);
    }
  };

  const handleRoomSelection = (room: Room | null) => {
    setCurrentRoom(room);
    
    // Mark messages as read when room is opened
    if (room) {
      setRooms(prev => prev.map(r => 
        r._id === room._id 
          ? { ...r, lastMessage: r.lastMessage ? { ...r.lastMessage, isRead: true } : undefined }
          : r
      ));
      
      // Force refresh messages for the room
      console.log('🔄 Room selected, fetching messages for:', room._id);
      fetchMessages(room._id);
    }
  };

  const value: ChatContextType = {
    rooms,
    currentRoom,
    messages,
    users,
    setCurrentRoom: handleRoomSelection,
    sendMessage,
    createRoom,
    searchUsers,
    loading
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};