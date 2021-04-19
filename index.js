const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  //cors: { origin: 'https://loophoria.herokuapp.com'} // heroku-client URL
  cors: { origin: "http://localhost:3000" }, // local-client URL
});

let userId = 1;
let start = 0;
let hashes = [];
let temphashes = [];
let count = 1;
let newRoom = "room1";
let roomManagement = [{ user: userId, buttons: [], room: newRoom, hash: [] }];

io.on("connection", (socket) => {
  console.log("connected");
  // unique user ID's can be refactored with native socketio connection hash id's
  const rooms = io.of("/").adapter.rooms;
  const sids = io.of("/").adapter.sids;
  
  //reset temphash array to avoid duplication
  temphashes = [];
  //update temphash array
  for (let sid of sids) {
    temphashes.push(sid[start]);
  }
  hashes.push(temphashes[temphashes.length - 1]);
  start = 0;
  //  console.log("HASHES", hashes);
  
  //find the latest hash
  //assign latest hash to latest user
  roomManagement[roomManagement.length - 1].hash.push(
    hashes[hashes.length - 1]
    );
    
    //Send User information, to newUser upon connection
    socket.join(newRoom);
    io.to(newRoom).emit("userId", { userId, newRoom });
    console.log("INITIAL-ROOMS-USERS", roomManagement);
    
    //On connect, update userId
  userId++;

  //ROOM CREATOR
  //--->INCREASE/DECREASE NUMBER INSIDE IF CONDITION, TO INCREASE OR DECREASE ROOM SIZES<---//
  if (userId > 2) {
    userId = 1;
    count++;
    newRoom = `room${count}`;
  }

  //update
  roomManagement.push({ user: userId, buttons: [], room: newRoom, hash: [] });

  //ROOM SELECTION FOR SENDING MSGS
  function room(user) {
    for (let room of roomManagement) {
      if (room.room === user[0].newRoom) {
        return room.room;
      }
    }
  }

  //ADD BUTTONS-IN-USE to use object
  function buttonAdd(index, user) {
    roomManagement.forEach((x) => {
      if (x.user === user[0].userId && x.room === user[0].newRoom) {
        x.buttons.push(index);
      }
    });
  }

  //REMOVE BUTTONS-NOT-IN-USE from user object
  function buttonRemove(id, user) {
    roomManagement.forEach((x) => {
      if (x.user === user[0].userId && x.room === user[0].newRoom) {
        x.buttons.forEach((y, index) => {
          if (y === id) {
            x.buttons.splice(index, 1);
          }
        });
      }
    });
  }

  //STOP ALL BUTTONS-IN-USE
  function findUser(hash, sids) {
    //change generic names on refactor
    //filter out sid strings from sids object array
    let sidFilter = [];
    for (let sid of sids) {
      sidFilter.push(sid[0]);
    }

    //compare logged hashes, to current sids
    let result = hash.filter((e) => !sidFilter.includes(e));
    start = 0;

    //compare logged hashes, and filter out disconnected hash
    let newHashes = hash.filter((e) => !result.includes(e));

    //update hash log
    hashes = newHashes;

    //finds disconnected user
    let disconnectedUser = roomManagement.filter((x) =>
      x["hash"].includes(result[0])
    );

    return disconnectedUser;
  }

  //REMOVE USER
  function removeUser(id) {
    let result = roomManagement.filter((x) => !x["hash"].includes(id[0]));
    roomManagement = result;
  }
  //START MESSAGE
  socket.on("send_message", (src, index, button, user) => {
    let roomNumber = room(user);
    buttonAdd(index, user);
    socket.broadcast.to(roomNumber).emit("message", src, index, button);
  });
  //STOP MESSAGE
  socket.on("stop_everyone", (src, index, button, user) => {
    let roomNumber = user[0].newRoom;
    buttonRemove(index, user);
    socket.broadcast.to(roomNumber).emit("stop_play", src, index, button);
  });
  //DISCONNECT MESSAGE
  socket.on("disconnect", () => {
    let userDisconnected = findUser(hashes, sids);
    let buttons = userDisconnected[0].buttons;
    let roomNumber = userDisconnected[0].room;
    removeUser(userDisconnected[0].hash);
    console.log("ON-DISCONNECT", roomManagement);
    //send to the right room
    socket.broadcast.to(roomNumber).emit("client_disconnected", buttons);
  });
});

//process.env.PORT ||
http.listen(4000, function () {
  console.log("listening on port 4000");
});
