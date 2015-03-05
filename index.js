var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SessionController = require('./session/session').SessionController;
var GameController = require('./game/game-controller').GameController;
var newEmitter = require('./communication/emitter').newEmitter;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
var emitter = newEmitter();
var sessionController = new SessionController(emitter, io);
var gameController = new GameController(emitter);
sessionController.init();
gameController.init();
emitter.on('error', function (error) {
  console.log('error caught', error);
});

var port = 3005;
http.listen(port, function(){
  console.log('listening on *:'+port);
});
