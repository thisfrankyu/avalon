/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var fs = require('fs');
var _ = require('underscore');
var express = require('express');
var config = require('./config/environment');
// Setup server
var app = express();

var privateKey = fs.readFileSync('certs/key.pem', 'utf8');
var certificate = fs.readFileSync('certs/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var https = require('https');

var SessionController = require('../session/session').SessionController;
var GameController = require('../game/game-controller').GameController;
var newEmitter = require('../communication/emitter').newEmitter;

//var server = require('http').createServer(app);
var server = https.createServer(credentials, app);
var io = require('socket.io')(server);

require('./config/express')(app);
require('./routes')(app);

app.get('/avalon.xml', function(req, res){
  res.sendFile(__dirname + '/client/avalon.xml');
});
var emitter = newEmitter();
var sessionController = new SessionController(emitter, io);
var gameController = new GameController(emitter);
sessionController.init();
gameController.init();
emitter.on('error', function (error) {
  console.log('error caught', error);
});


// Start server
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;
