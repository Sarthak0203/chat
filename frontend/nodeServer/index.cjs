const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow all origins
    methods: ["GET", "POST"],  // Allow GET and POST methods
  },
});

const PORT = 3000 || process.env.REACT_APP_PORT;
const users = {};
const rooms = {};
const userRooms = {};

function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("message", (message) => {
    const { roomId } = message;
    if (roomId) {
      socket.broadcast.to(roomId).emit("message", message);
    } else {
      socket.broadcast.emit("message", message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
    const userRoom = userRooms[socket.id];
    if (userRoom) {
      const roomUsers = rooms[userRoom];
      if (roomUsers) {
        const index = roomUsers.indexOf(socket.id);
        if (index !== -1) {
          roomUsers.splice(index, 1);
          socket.broadcast.to(userRoom).emit("left", users[socket.id]);
        }
      }
    }
    delete users[socket.id];
  });

  socket.on("new-user-joined", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("user-joined", name);
  });

  socket.on("send", (data) => {
    const user = users[socket.id];
    const roomId = userRooms[socket.id];
    if (user && roomId) {
      socket.broadcast.to(roomId).emit("receive", { message: data.message, firstName: user.firstName });
    }
  });

  socket.on("logout", (user, ack) => {
    socket.broadcast.to(userRooms[socket.id]).emit("left", user);
    delete users[socket.id];
    ack();
  });

  socket.on("create-room", () => {
    const roomId = generateRoomCode();
    rooms[roomId] = [socket.id];
    userRooms[socket.id] = roomId;
    socket.join(roomId);
    socket.emit("room-created", roomId);
    console.log("Room created:", roomId);
  });

  socket.on("join-room", (roomId) => {
    if (rooms[roomId]) {
      rooms[roomId].push(socket.id);
      userRooms[socket.id] = roomId;
      socket.join(roomId);
      socket.emit("room-joined", roomId);
      socket.broadcast.to(roomId).emit("user-joined", users[socket.id]);
      console.log("User joined room:", roomId);
    } else {
      socket.emit("room-not-found", { message: "Room does not exist" });
    }
  });

  socket.on("leave-room", () => {
    const roomId = userRooms[socket.id];
    if (roomId) {
      const index = rooms[roomId].indexOf(socket.id);
      rooms[roomId].splice(index, 1);
      delete userRooms[socket.id];
      socket.leave(roomId);
      socket.emit("left-room", roomId);
      socket.broadcast.to(roomId).emit("left", users[socket.id]);
      console.log("User left room:", roomId);
    }
  });

  socket.on("video-call-started", (user, roomId) => {
    socket.to(roomId).emit("incoming-call", users[socket.id]);
  });

  socket.on("call-invitation", (user) => {
    socket.broadcast.to(userRooms[socket.id]).emit("incoming-call", user);
  });

  socket.on("call-accepted", (user) => {
    socket.broadcast.to(userRooms[user.id]).emit("call-accepted", user);
  });

  socket.on("call-declined", (user) => {
    socket.broadcast.to(userRooms[user.id]).emit("call-declined", user);
  });

  socket.on("name-change", ({ oldName, newName }) => {
    socket.broadcast.to(userRooms[socket.id]).emit("receive", { message: `${oldName} changed their name to ${newName}`, firstName: "System" });
  });
});

server.listen(7500, () => {
  console.log("listening on Port 7500");
});
