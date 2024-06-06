require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: { origin: "http://127.0.0.1/:5173" },
});
const PORT = 3000 || process.env.REACT_APP_PRT;
io.on("connection", (socket) => {
  console.log("Connected");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("message", (roomId, message) => {
    socket.to(roomId).emit("message", message);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
  });
});

function error(err, req, res, next) {
  // log it
  if (!test) console.error(err.stack);

  // respond with 500 "Internal Server Error".
  res.status(500);
  res.send("Internal Server Error");
}
app.use(error);
server.listen(7501, () => {
  console.log("listening on Port 7501");
});