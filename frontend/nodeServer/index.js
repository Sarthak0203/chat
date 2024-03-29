const io = require('socket.io')(8000, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"]  // Allow GET and POST methods
    }
});
const users = {};

io.on('connection', socket => {
    socket.on('new-user-joined', name => {
        users[socket.id] = name;
        // Send a message to the new user about the currently connected users
        let connectedUsers = Object.values(users).map(user => user.firstName);
        // Remove the new user's name from the list of connected users
        const index = connectedUsers.indexOf(name.firstName);
        if (index !== -1) {
            connectedUsers.splice(index, 1);
        }
        connectedUsers = ['You'].concat(connectedUsers);
        if (connectedUsers.length > 1) {
            socket.emit('welcome-message', `Welcome! Users currently connected: ${connectedUsers.join(', ')}`);
        } else {
            socket.emit('welcome-message', 'Welcome! No other users are currently connected.');
        }
        socket.broadcast.emit('user-joined', name);
        console.log('user connected');
        
    });
    
    socket.on('send', message => {
        if (users[socket.id]) {
            let user = users[socket.id];
            if (user && user.firstName) {
                socket.broadcast.emit('receive', {message: message, firstName: user.firstName})
                console.log('message sent')
            }
        }
    });
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            console.log('user disconnected')
            socket.broadcast.emit('left', users[socket.id]);
            delete users[socket.id];
        }
    });
    
    socket.on('logout', (user, ack) => {
        socket.broadcast.emit('left', user);
        delete users[socket.id];
        ack();
    });
    socket.on('video-call-started', (user) => {
        socket.broadcast.emit('receive', {message: `${user.firstName} started a video chat`, firstName: 'System'});
      });
      
      socket.on('call-invitation', (user) => {
        socket.broadcast.emit('incoming-call', user);
      });
    
      socket.on('call-accepted', (user) => {
        socket.broadcast.emit('call-accepted', user);
      });
    
      socket.on('call-declined', (user) => {
        socket.broadcast.emit('call-declined', user);
      });
      socket.on('name-change', ({ oldName, newName }) => {
        socket.broadcast.emit('receive', {message: `${oldName} changed their name to ${newName}`, firstName: 'System'});
      });
});