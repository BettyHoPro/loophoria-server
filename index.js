const app = require("express") ();
const http = require("http").createServer( app );
const io = require('socket.io') (http, {
  cors: { origin: 'https://loophoria.herokuapp.com'} // this will become the heroku server link url
//  cors: { origin: "http://localhost:3000" }
});



io.on('connection', socket => {
  console.log('connected');
  socket.on('send_message', (src, index, button) => {
    socket.broadcast.emit("message", src, index, button);
  });
  socket.on("stop_everyone", (src, index, button) => {
    socket.broadcast.emit("stop_play", src, index, button);
  }); 
});



http.listen(process.env.PORT || 4000, function () {
  console.log("listening on port 4000");
});






