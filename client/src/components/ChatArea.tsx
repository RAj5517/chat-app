import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
// import { Message } from '../types';

const ChatArea: React.FC = () => {
  const { currentRoom, messages, sendMessage } = useChat();
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    console.log('🔍 ChatArea - Messages count:', messages.length);
    console.log('🔍 ChatArea - Current room:', currentRoom?._id);
    console.log('🔍 ChatArea - Messages:', messages);
    console.log('🔍 ChatArea - Last message:', messages[messages.length - 1]);
    console.log('🔍 RENDERING - Messages count:', messages.length);
    console.log('🔍 RENDERING - Messages:', messages);
  }, [messages, currentRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && currentRoom) {
      sendMessage(messageInput.trim(), currentRoom._id);
      setMessageInput('');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Welcome to ChatApp</h3>
          <p className="text-gray-400 text-lg">Select a chat to start messaging</p>
          <div className="mt-6 flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const getRoomName = () => {
    if (currentRoom.roomType === 'group') {
      return currentRoom.roomName;
    }
    const currentUserId = user?.id || user?._id;
    const otherParticipant = currentRoom.participants.find(p => {
      const participantId = p.id || p._id;
      return participantId !== currentUserId;
    });
    console.log('🔍 Current user ID:', currentUserId);
    console.log('🔍 Participants:', currentRoom.participants);
    console.log('🔍 Other participant:', otherParticipant);
    return otherParticipant?.username || 'Unknown User';
  };

  const getRoomAvatar = () => {
    if (currentRoom.roomType === 'group') {
      return '👥';
    }
    const otherParticipant = currentRoom.participants.find(p => 
      (p.id !== user?.id && p.id !== user?._id) && 
      (p._id !== user?.id && p._id !== user?._id)
    );
    return otherParticipant?.avatar || '👤';
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center animate-slideDown">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3 animate-pulse">
            <span className="text-sm font-medium text-white">
              {getRoomAvatar()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{getRoomName()}</h2>
            <p className="text-sm text-gray-400">
              {currentRoom.roomType === 'private' ? 'Private chat' : 'Group chat'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - WhatsApp Style */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8 animate-fadeIn">
            <div className="animate-bounce">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Simplified and more robust message comparison
            const currentUserId = user?.id || user?._id;
            const messageSenderId = message.sender.id || message.sender._id;
            const currentUsername = user?.username;
            const messageSenderUsername = message.sender.username;
            
            // Debug logging
            console.log('🔍 Current user ID:', currentUserId);
            console.log('🔍 Message sender ID:', messageSenderId);
            console.log('🔍 Current username:', currentUsername);
            console.log('🔍 Message sender username:', messageSenderUsername);
            
            // Check if this is the current user's message
            const isMyMessage = currentUserId === messageSenderId || 
                                currentUsername === messageSenderUsername;
            
            console.log('🔍 Is my message:', isMyMessage);
            console.log('🔍 Message will appear on:', isMyMessage ? 'RIGHT (blue)' : 'LEFT (gray)');
            
            // Check if this is the first message in a group
            const isFirstInGroup = index === 0 || 
              (messages[index - 1].sender.id !== message.sender.id && 
               messages[index - 1].sender._id !== message.sender._id);
            
            // Check if this is the last message in a group  
            const isLastInGroup = index === messages.length - 1 ||
              (messages[index + 1].sender.id !== message.sender.id && 
               messages[index + 1].sender._id !== message.sender._id);
            
            return (
              <div
                key={`${message._id}-${message.createdAt}-${index}`}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} animate-slideIn ${
                  isFirstInGroup ? 'mt-2' : 'mt-1'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`flex items-end max-w-xs lg:max-w-md ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar for other person's messages */}
                  {!isMyMessage && isFirstInGroup && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-2 mb-1">
                      <span className="text-xs font-medium text-white">
                        {message.sender.avatar || message.sender.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Spacer for alignment when no avatar */}
                  {!isMyMessage && !isFirstInGroup && (
                    <div className="w-8 h-8 mr-2"></div>
                  )}
                  
                  {/* Message bubble - WhatsApp style with proper grouping */}
                  <div
                    className={`px-4 py-2 max-w-xs lg:max-w-md shadow-sm ${
                      isMyMessage
                        ? `bg-blue-500 text-white ${isLastInGroup ? 'rounded-br-md' : 'rounded-r-2xl'} ${isFirstInGroup ? 'rounded-tr-2xl' : 'rounded-l-2xl'} border-l-4 border-blue-400`
                        : `bg-gray-700 text-white ${isLastInGroup ? 'rounded-bl-md' : 'rounded-l-2xl'} ${isFirstInGroup ? 'rounded-tl-2xl' : 'rounded-r-2xl'} border-r-4 border-gray-500`
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <p className={`text-xs mt-1 text-right ${
                      isMyMessage ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;