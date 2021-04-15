const app = require("express") ();
const http = require("http").createServer( app );
const io = require('socket.io') (http, {
  // cors: { origin: 'http://localhost:3000'}
  cors: { origin: 'https://loophoria.herokuapp.com'} // this will become the heroku server link url
});

io.on('connection', socket => {
  console.log('connected');
  socket.on('send_message', ( src ) => {
    socket.broadcast.emit("message", src);
  });
  socket.on("stop_message", (src) => {
    socket.broadcast.emit("stop_play", src);
  }); 
});

http.listen(4000, function () {
  console.log("listening on port 4000");
});

