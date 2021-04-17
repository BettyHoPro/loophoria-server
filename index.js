const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  //  cors: { origin: 'https://loophoria.herokuapp.com'} // heroku-client URL
  cors: { origin: "http://localhost:3000" }, // local-client URL
});

let userId = 1;
let count = 1;
let newRoom = "room1";
let userBttns = [];
let roomManagement = [{ user: userId, buttons: userBttns, room: newRoom }];

io.on("connection", (socket) => {
  console.log("connected");

  //Send User information, to newUser upon connection
  socket.join(newRoom);
  io.to(newRoom).emit("userId", { userId, newRoom });

  //On connect, update userId
  userId++;
  console.log("ON CONNECTION", roomManagement);

  //ROOMS
  //if userId > 4, reset to 1, create new room
  if (userId > 4) {
    userId = 1;
    count++;
    newRoom = `room${count}`;
  }

  //update
  roomManagement.push({ user: userId, buttons: userBttns, room: newRoom });

  //BUTTON CONTROL
  //Everytime a button is played, push it to a button
  //Everytime a button is stopped, remove it
  //on disconnect, find user id, and send buttons into client pool

  socket.on("send_message", (src, index, button) => {
    socket.broadcast.emit("message", src, index, button);
  });
  socket.on("stop_everyone", (src, index, button) => {
    socket.broadcast.emit("stop_play", src, index, button);
  });
  socket.on("disconnect", () => {
    console.log("CLIENT DISCONNECTED");
    socket.broadcast.emit("client_disconnected", roomManagement);
  });
});

http.listen(process.env.PORT || 4000, function () {
  console.log("listening on port 4000");
});
