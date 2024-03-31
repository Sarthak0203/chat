const io = require('socket.io')(8000, {
    cors: {
      origin: "*",  // Allow all origins
      methods: ["GET", "POST"]  // Allow GET and POST methods
    }
  });
  
  const users = {};
  let rooms = {};
  let userRooms = {};
  
  function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  } 
  
  io.on('connection', socket => {
    socket.on('new-user-joined', name => {
      users[socket.id] = name;
      // Send a message to the new user about the currently connected users in their room (if any)
      let connectedUsers = [];
      if (userRooms[socket.id]) {
        connectedUsers = rooms[userRooms[socket.id]].map(id => users[id]).filter(user => user);
      }
      connectedUsers = connectedUsers.filter(user => user).map(user => user.firstName);
      if (connectedUsers.length > 0) {
        socket.emit('welcome-message', `Welcome! Users currently connected in your room: ${connectedUsers.join(', ')}`);
      } else {
        socket.emit('welcome-message', 'Welcome! No other users are currently connected in your room.');
      }
      socket.broadcast.to(userRooms[socket.id] || '').emit('user-joined', name); // Broadcast to the user's room (if any)
      console.log('user connected');
    });
  
    socket.on('send', data => {
        console.log(data);
        if (users[socket.id]) {
          let user = users[socket.id];
          if (user && user.firstName) {
          let roomCode = userRooms[socket.id];
          if (roomCode) {
            socket.broadcast.to(roomCode).emit('receive', { message: data.message, firstName: user.firstName });
            console.log('message sent');
          } else {
            console.log('message not sent, user is not in a room');
          }
        }
      }
    });
  
    socket.on('disconnect', () => {
      if (users[socket.id]) {
        console.log('user disconnected');
        // Remove the user from the room they were in
        for (let code in rooms) {
          const index = rooms[code].indexOf(socket.id);
          if (index !== -1) {
            rooms[code].splice(index, 1);
            // Notify other users in the room about the disconnection
            socket.to(code).emit('left', users[socket.id]);
            break;
          }
        }
        delete users[socket.id];
      }
    });
  
    socket.on('logout', (user, ack) => {
      socket.broadcast.to(userRooms[socket.id] || '').emit('left', user); // Broadcast to the user's room (if any)
      delete users[socket.id];
      ack();
    });
  
    socket.on('video-call-started', (user, roomCode) => {
        const callingUser = users[user.id]; // Get user object from users map
        socket.to(roomCode).emit('incoming-call', callingUser); // Broadcast to the user's room only
      });
  
    socket.on('call-invitation', (user) => {
        console.log(user);
      socket.broadcast.to(userRooms[socket.id] || '').emit('incoming-call', user);
    });
  
    socket.on('call-accepted', (user) => {
      socket.broadcast.to(userRooms[user.id] || '').emit('call-accepted', user);
    });
  
    socket.on('call-declined', (user) => {
      socket.broadcast.to(userRooms[user.id] || '').emit('call-declined', user);
    });
  
    socket.on('name-change', ({ oldName, newName }) => {
      socket.broadcast.to(userRooms[socket.id] || '').emit('receive', { message: `${oldName} changed their name to ${newName}`, firstName: 'System' });
    });
    socket.on('create-room', () => {
        let roomCode = generateRoomCode();
        rooms[roomCode] = [socket.id];
        userRooms[socket.id] = roomCode;
        socket.join(roomCode);
        socket.emit('room-created', roomCode); // Emit room-created event with room code
        console.log('room created');
      });
      
      socket.on('join-room', (roomCode) => {
        if (rooms[roomCode]) {
          rooms[roomCode].push(socket.id);
          userRooms[socket.id] = roomCode;
          socket.join(roomCode);
          socket.emit('room-joined', roomCode); // Emit room-joined event with room code
          socket.broadcast.to(roomCode).emit('user-joined', users[socket.id]);
          console.log('user joined a room');
        } else {
          // Emit an error event if the room does not exist
          socket.emit('room-not-found', { message: 'Room does not exist' });
        }
      });
      
      socket.on('leave-room', () => {
        let roomCode = userRooms[socket.id];
        if (roomCode) {
          const index = rooms[roomCode].indexOf(socket.id);
          rooms[roomCode].splice(index, 1);
          delete userRooms[socket.id];
          socket.leave(roomCode);
          socket.emit('left-room', roomCode);
          socket.broadcast.to(roomCode).emit('left', users[socket.id]);
          console.log('user left a room');
        }
      });

});