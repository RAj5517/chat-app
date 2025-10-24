# P2P Chat Platform

A real-time peer-to-peer chatting platform built with the MERN stack (MongoDB, Express.js, React, Node.js) with Socket.io for real-time messaging.

## Features

- 🔐 **User Authentication** - JWT-based authentication with registration and login
- 💬 **Real-time Messaging** - Socket.io powered instant messaging
- 👥 **User Management** - Search and connect with other users
- 🎨 **Modern UI** - Beautiful interface built with React and Tailwind CSS
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Secure** - Password hashing and JWT tokens
- 🚀 **Deployable** - Ready for deployment on free platforms

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd p2p-chat-platform
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/p2p-chat
   JWT_SECRET=your-super-secret-jwt-key-here
   CLIENT_URL=http://localhost:3000
   PORT=5000
   ```

5. **Start the application**
   ```bash
   # Start backend (in one terminal)
   npm run dev
   
   # Start frontend (in another terminal)
   cd client
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Deployment

### Backend Deployment (Railway/Render)

1. **Railway** (Recommended)
   - Connect your GitHub repository
   - Set environment variables:
     - `MONGODB_URI` (MongoDB Atlas connection string)
     - `JWT_SECRET` (your secret key)
     - `CLIENT_URL` (your frontend URL)
   - Deploy automatically

2. **Render**
   - Create a new Web Service
   - Connect your repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables

### Frontend Deployment (Vercel/Netlify)

1. **Vercel** (Recommended)
   - Connect your GitHub repository
   - Set build command: `cd client && npm run build`
   - Set output directory: `client/build`
   - Add environment variable: `REACT_APP_API_URL` (your backend URL)

2. **Netlify**
   - Connect your repository
   - Set build command: `cd client && npm run build`
   - Set publish directory: `client/build`
   - Add environment variable: `REACT_APP_API_URL`

### Database Setup

1. **MongoDB Atlas** (Free tier available)
   - Create a cluster
   - Get connection string
   - Update `MONGODB_URI` in your environment variables

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/search?q=query` - Search users
- `GET /api/users/:id` - Get user by ID

### Chat
- `POST /api/chat/room` - Create or get room
- `GET /api/chat/rooms` - Get user's rooms
- `GET /api/chat/messages/:roomId` - Get room messages
- `POST /api/chat/messages` - Send message
- `PUT /api/chat/messages/:messageId/read` - Mark message as read

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── package.json
├── models/                 # MongoDB models
├── routes/                  # API routes
├── middleware/             # Express middleware
├── server.js               # Express server
└── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

