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
        
        // Always add message to current room if it's the active room
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
          console.log('⚠️ Message not for current room, but will update rooms list');
          // Even if not current room, add message if it's for any of our rooms
          setMessages(prev => {
            const exists = prev.some(msg => msg._id === message._id || 
              (msg.content === message.content && msg.createdAt === message.createdAt));
            if (!exists) {
              console.log('✅ Adding message to messages list for future display');
              return [...prev, message];
            }
            return prev;
          });
        }
        
        
        // Force re-render to ensure messages are displayed in chat area
        setTimeout(() => {
          setMessages(prev => {
            console.log('🔄 Force re-render - Current messages count:', prev.length);
            return [...prev];
          });
        }, 100);
        
        // Additional force update after a longer delay
        setTimeout(() => {
          setMessages(prev => {
            console.log('🔄 Second force re-render - Current messages count:', prev.length);
            return [...prev];
          });
        }, 500);
        
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
      setRooms(response.data);
    } catch (error: any) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
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
    if (!socket || !user) return;

    try {
      const response = await axios.post('/chat/messages', {
        roomId,
        content
      });

      const message = response.data;
      console.log('📤 Message sent:', message);
      console.log('📤 Message sender ID:', message.sender.id || message.sender._id);
      console.log('📤 Current user ID:', user.id || user._id);
      console.log('📤 Message sender username:', message.sender.username);
      console.log('📤 Current user username:', user.username);
      
      // Add message to local state immediately
      setMessages(prev => [...prev, message]);
      
      // Update rooms list with new message
      setRooms(prev => prev.map(room => 
        room._id === roomId 
          ? { ...room, lastMessage: message }
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
      console.error('Error sending message:', error);
    }
  };

  const createRoom = async (participantId: string) => {
    try {
      console.log('Creating room with participantId:', participantId);
      const response = await axios.post('/chat/room', {
        participantId
      });
      
      const newRoom = response.data;
      setRooms(prev => [newRoom, ...prev]);
      setCurrentRoom(newRoom);
    } catch (error: any) {
      console.error('Error creating room:', error);
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