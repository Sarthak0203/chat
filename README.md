# MERN Stack Chat Application

A real-time chat application with video calling capabilities built with MongoDB, Express.js, React, and Node.js.

## Features

- User authentication (Email/Password and Google OAuth)
- Real-time messaging
- Video calling
- Room-based chat
- File uploads with Cloudinary
- Responsive UI with Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Google OAuth credentials
- Cloudinary account (for file uploads)

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Installation & Setup

1. Install dependencies for all servers:
   ```bash
   npm run install-all
   ```

2. Install the root dependencies:
   ```bash
   npm install
   ```

3. Start all servers simultaneously:
   ```bash
   npm start
   ```

## Manual Setup (Alternative)

If you prefer to run servers individually:

### Backend Server (Port 9000)
```bash
cd backend
npm install
npm run dev
```

### Frontend React App (Port 5173)
```bash
cd frontend
npm install
npm start
```

### Chat Server (Port 7500)
```bash
cd frontend/nodeServer
node index.cjs
```

### Video Call Server (Port 7501)
```bash
cd frontend/signalingServer
node index.cjs
```

## Access the Application

Once all servers are running, open your browser and navigate to:
```
http://localhost:5173
```

## Server Ports

- Frontend (React): http://localhost:5173
- Backend (Express): http://localhost:9000
- Chat Server (Socket.io): http://localhost:7500
- Video Server (WebRTC): http://localhost:7501

## Troubleshooting

1. **MongoDB Connection Issues**: Ensure your IP is whitelisted in MongoDB Atlas
2. **Google OAuth Issues**: Verify your redirect URIs in Google Console
3. **Port Conflicts**: Make sure no other applications are using the required ports
4. **CORS Issues**: Check that frontend URL matches the CORS configuration in backend

## Project Structure

```
chat/
├── backend/          # Express.js server
├── frontend/         # React application
│   ├── nodeServer/   # Socket.io chat server
│   └── signalingServer/ # WebRTC signaling server
└── package.json      # Root package.json for running all servers
```
