var fs = require('fs');
var app = require('express')();
var http = require('http').Server(app);
var privateKey = fs.readFileSync('../certs/key.pem', 'utf8');
var certificate = fs.readFileSync('../certs/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var https = require('https');
var server = https.createServer(credentials, app);
var io = require('socket.io')(server);
var SessionController = require('../session/session').SessionController;
var GameController = require('../game/game-controller').GameController;
var newEmitter = require('../communication/emitter').newEmitter;

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/avalon.xml', function(req, res){
  res.sendFile(__dirname + '/avalon.xml');
});
var emitter = newEmitter();
var sessionController = new SessionController(emitter, io);
var gameController = new GameController(emitter);
sessionController.init();
gameController.init();
emitter.on('error', function (error) {
  console.log('error caught', error);
});

var port = 3000;
server.listen(port, function(){
  console.log('listening on *:' + port);
});
