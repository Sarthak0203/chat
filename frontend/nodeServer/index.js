const io = require('socket.io')(8000, {
    cors: {
        origin: "*",  // Allow all origins
        methods: ["GET", "POST"]  // Allow GET and POST methods
    }
});
const users = {};

io.on('connection', socket=>{
    
    socket.on('new-user-joined',name =>{
        users[socket.id]=name;
        socket.broadcast.emit('user-joined',name);
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
    
}) 
