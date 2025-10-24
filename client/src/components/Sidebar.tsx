import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { Room, User } from '../types';

const Sidebar: React.FC = () => {
  const { rooms, currentRoom, setCurrentRoom, users, createRoom, searchUsers } = useChat();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleRoomClick = (room: Room) => {
    setCurrentRoom(room);
  };

  const handleUserClick = async (selectedUser: User) => {
    try {
      const userId = selectedUser.id || selectedUser._id;
      console.log('Selected user:', selectedUser);
      console.log('User ID to use:', userId);
      
      if (!userId) {
        console.error('No user ID found');
        return;
      }
      
      await createRoom(userId);
      setShowUserSearch(false);
      setSearchQuery('');
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchUsers(query);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoomName = (room: Room) => {
    if (room.roomType === 'group') {
      return room.roomName;
    }
    const currentUserId = user?.id || user?._id;
    const otherParticipant = room.participants.find(p => 
      (p.id !== currentUserId) && (p._id !== currentUserId)
    );
    return otherParticipant?.username || 'Unknown User';
  };

  const getRoomAvatar = (room: Room) => {
    if (room.roomType === 'group') {
      return '👥';
    }
    const currentUserId = user?.id || user?._id;
    const otherParticipant = room.participants.find(p => {
      const participantId = p.id || p._id;
      return participantId !== currentUserId;
    });
    return otherParticipant?.avatar || '👤';
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col h-full transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="p-2 text-blue-400 hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        
        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full px-3 py-2 pl-10 bg-gray-800 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* User Search Results */}
      {showUserSearch && (
        <div className="p-4 border-b border-gray-700 animate-slideDown">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Start a new chat</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id || user._id}
                onClick={() => handleUserClick(user)}
                className="w-full flex items-center p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 animate-pulse">
                  <span className="text-sm font-medium text-white">
                    {user.avatar || user.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2">
        {rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            <div className="animate-bounce">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>No chats yet</p>
            <p className="text-sm">Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {rooms.map((room, index) => (
              <button
                key={room._id}
                onClick={() => handleRoomClick(room)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 hover:scale-105 ${
                  currentRoom?._id === room._id
                    ? 'bg-blue-600 border-r-2 border-blue-400 shadow-lg'
                    : 'hover:bg-gray-800'
                } ${
                  room.lastMessage && !room.lastMessage.isRead && 
                  room.lastMessage.sender && 
                  ((room.lastMessage.sender.id !== user?.id && room.lastMessage.sender._id !== user?.id) &&
                   (room.lastMessage.sender.id !== user?._id && room.lastMessage.sender._id !== user?._id))
                    ? 'bg-gray-800 border-l-2 border-blue-400'
                    : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3 animate-pulse">
                  <span className="text-sm font-medium text-white">
                    {getRoomAvatar(room)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {getRoomName(room)}
                    </p>
                    {room.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {new Date(room.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <p className="text-xs text-gray-400 truncate">
                      {room.lastMessage.content}
                    </p>
                  )}
                  {room.lastMessage && !room.lastMessage.isRead && 
                   room.lastMessage.sender && 
                   ((room.lastMessage.sender.id !== user?.id && room.lastMessage.sender._id !== user?.id) &&
                    (room.lastMessage.sender.id !== user?._id && room.lastMessage.sender._id !== user?._id)) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto animate-pulse"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* User Info with Logout */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3 animate-pulse">
              <span className="text-sm font-medium text-white">
                {user?.avatar || user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-all duration-200 hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 animate-slideUp">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700 rounded-lg transition-all duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;