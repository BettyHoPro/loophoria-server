const app = require("express") ();
const http = require("http").createServer( app );
const io = require('socket.io') (http, {
//  cors: { origin: 'https://loophoria.herokuapp.com'} // heroku-client URL
  cors: { origin: "http://localhost:3000" } // local-client URL
});



io.on('connection', socket => {
  console.log('connected');

  // let enableButtons = [{user: user, buttons: buttons}];



  socket.on('send_message', (src, index, button) => {
    socket.broadcast.emit("message", src, index, button);
  });
  socket.on("stop_everyone", (src, index, button) => {
    socket.broadcast.emit("stop_play", src, index, button);
  });

  // socket.on("enable_buttons", (buttonsInUse) => {
  //   console.log("CIENT DISCONNECTED");
  //   socket.broadcast.emit("client_disconnected", buttonsInUse);
  // }); 
  //  socket.on("disconnect", () => {
  //   console.log("CIENT DISCONNECTED");
  //   socket.broadcast.emit("client_disconnected", enableButtons);
  // }); 

});



http.listen(process.env.PORT || 4000, function () {
  console.log("listening on port 4000");
});






