const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  //cors: { origin: 'https://loophoria.herokuapp.com'} // heroku-client URL
  cors: { origin: "http://localhost:3000" }, // local-client URL
});

let userId = 1;
let count = 1;
let newRoom = "room1";
let roomManagement = [{ user: userId, buttons: [], room: newRoom }];

io.on("connection", (socket) => {
  console.log("connected");

  // unique user ID's can be refactored with native socketio connection hash id's
  // const rooms = io.of("/").adapter.rooms;
  // const sids = io.of("/").adapter.sids;
  // console.log("ROOMS", rooms);
  // console.log("SIDS", sids);

  //Send User information, to newUser upon connection
  socket.join(newRoom);
  io.to(newRoom).emit("userId", { userId, newRoom });

  //On connect, update userId
  userId++;
//  console.log("ON CONNECTION", roomManagement);

  //ROOMS
  //if userId > 4, reset to 1, create new room
  if (userId > 4) {
    userId = 1;
    count++;
    newRoom = `room${count}`;
  }

  //update
  roomManagement.push({ user: userId, buttons: [], room: newRoom });

  //ROOM SELECTION
  function room(user) {
    //console.log("USER OBJECT", user);
    for (let room of roomManagement) {
      if (room.room === user[0].newRoom) {
        // console.log("INSIDE", room.room);
        return room.room;
      }
    }
  }

  //USER BUTTONS-IN-USE

  
  function buttonAdd(index, user) {
    roomManagement.forEach((x) => {
      if (x.user === user[0].userId && x.room === user[0].newRoom) {
        x.buttons.push(index);
      }
    }) 
  }
  

  function buttonRemove(id, user) {
    roomManagement.forEach((x) => {
      console.log("X",x);
      console.log("USER[0]", user[0]);
      if (x.user === user[0].userId && x.room === user[0].newRoom) {
        x.buttons.forEach((y, index) => {      
          if (y === id) {
            x.buttons.splice(index, 1)
          }
        });
      }
    }) 
  console.log("ROOMMANAGEMENT", roomManagement);
  }



  //BUTTON CONTROL
  //Everytime a button is played, push it to a button
  //Everytime a button is stopped, remove it
  //on disconnect, find user id, and send buttons into client pool
  
  socket.on("send_message", (src, index, button, user) => {
    let roomNumber = room(user);
    buttonAdd(index, user);        
    socket.broadcast.to(roomNumber).emit("message", src, index, button);
  });

  socket.on("stop_everyone", (src, index, button, user) => {  
    let roomNumber = user[0].newRoom
    buttonRemove(index, user)
    socket.broadcast.to(roomNumber).emit("stop_play", src, index, button);
  });

  socket.on("disconnect", () => {
    //this is where we need to disconnect and stop buttons.
    //console.log("CLIENT DISCONNECTED");
    socket.broadcast.to().emit("client_disconnected", roomManagement);
  });
});

http.listen(process.env.PORT || 4000, function () {
  console.log("listening on port 4000");
});
