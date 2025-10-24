export interface User {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  _id: string;
  participants: User[];
  roomType: 'private' | 'group';
  roomName: string;
  lastMessage?: Message;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ChatContextType {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  users: User[];
  setCurrentRoom: (room: Room | null) => void;
  sendMessage: (content: string, roomId: string) => void;
  createRoom: (participantId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  loading: boolean;
}
