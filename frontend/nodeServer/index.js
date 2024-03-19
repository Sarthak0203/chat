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
    });
    socket.on('send', message => {
        if (users[socket.id] && users[socket.id].firstName) {
          socket.broadcast.emit('receive', {message: message, firstName: users[socket.id].firstName})
        }
      })
    socket.on('disconnect',message=>{
        socket.broadcast.emit('left', users[socket.id])
        delete users[socket.id];
    })
}) 