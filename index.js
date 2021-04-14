const app = require("express") ();
const http = require("http").createServer( app );
const io = require('socket.io') (http, {
  cors: { origin: 'http://localhost:3000'} // this will become the heroku server link url
});

io.on('connection', socket => {
  console.log('connected');

  // send to the server side 
  socket.emit('initial_connection', {foo: "bar"});

  // get from the server side
  socket.on('send message', ({ name, message }) => {
    io.emit('message', { name, message });
  });
});

http.listen(4000, function () {
  console.log("listening on port 4000");
});

