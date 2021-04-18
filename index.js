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
  // console.log("ROOMS", rooms);
  //console.log("SIDS", sids);
  //reset hash array to avoid duplication
  //hashes are still all available in sids.
  temphashes = [];
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

  //On connect, update userId
  userId++;

  //ROOMS
  //if userId > 4, reset to 1, create new room
  if (userId > 4) {
    userId = 1;
    count++;
    newRoom = `room${count}`;
  }

  //update
  roomManagement.push({ user: userId, buttons: [], room: newRoom, hash: [] });

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
    });
  }

  function buttonRemove(id, user) {
    roomManagement.forEach((x) => {
      console.log("X", x);
      console.log("USER[0]", user[0]);
      if (x.user === user[0].userId && x.room === user[0].newRoom) {
        x.buttons.forEach((y, index) => {
          if (y === id) {
            x.buttons.splice(index, 1);
          }
        });
      }
    });
    console.log("ROOMMANAGEMENT", roomManagement);
  }

  //BUTTON CONTROL
  //on disconnect, find user id, and send buttons into client pool

  // function buttonRemove(id, user) {
  //   roomManagement.forEach((x) => {
  //     console.log("X", x);
  //     console.log("USER[0]", user[0]);
  //     if (x.user === user[0].userId && x.room === user[0].newRoom) {
  //       x.buttons.forEach((y, index) => {
  //         if (y === id) {
  //           x.buttons.splice(index, 1);
  //         }
  //       });
  //     }
  //   });
  //   console.log("ROOMMANAGEMENT", roomManagement);
  // }

  function findUser(hash, sids) {
    //filter out sid strings from sids object array
    let sidFilter = [];
    for (let sid of sids) {
      sidFilter.push(sid[0]);
    }

    //compare logged hashes, to current sids
    let result = hash.filter((e) => !sidFilter.includes(e));
    start = 0;
  //  console.log("DISCONNECTED-HASH", result);

    //compare logged hashes, and filter out disconnected hash
    let newHashes = hash.filter((e) => !result.includes(e));
  //  console.log("NEW-HASHES", newHashes);

    //update hash log
    hashes = newHashes;
  //  console.log("UPDATED-HASHES", hashes);

    //finds disconnected user
    let disconnectedUser = roomManagement.filter((x) =>
      x["hash"].includes(result[0])
    );
  //  console.log("MISSING-USER", disconnectedUser);

    return disconnectedUser;
  }

  /////////////
  /////////////
  /////////////
  //REMOVE USER
  function removeUser(id) {
    console.log("ROOM-MANAGEMENT", roomManagement);
    let result = roomManagement.filter((x) => !x["hash"].includes(id[0]));
    roomManagement = result;
    console.log("NEW-ROOM-MANAGEMENT", roomManagement);
  }



  socket.on("send_message", (src, index, button, user) => {
    let roomNumber = room(user);
    buttonAdd(index, user);
    socket.broadcast.to(roomNumber).emit("message", src, index, button);
  });

  socket.on("stop_everyone", (src, index, button, user) => {
    let roomNumber = user[0].newRoom;
    buttonRemove(index, user);
    socket.broadcast.to(roomNumber).emit("stop_play", src, index, button);
  });

  socket.on("disconnect", () => {
    let userDisconnected = findUser(hashes, sids);
    let buttons = userDisconnected[0].buttons;
    let roomNumber = userDisconnected[0].room;
    removeUser(userDisconnected[0].hash);
    //send out button index's to relinquish control
    //send to the right room
    //userDisconnect[0].room for room id??
    //userDisconnect[0].buttons to broadcast??
    //socket.broadcast.to(roomNumber).emit("client_disconnected", roomManagement);
    //EVERYTHING GETS DROPPED BECAUSE OF THE ALERT, if it timesout the connection
    socket.broadcast.to(roomNumber).emit("client_disconnected", buttons);
  });
});

http.listen(process.env.PORT || 4000, function () {
  console.log("listening on port 4000");
});
