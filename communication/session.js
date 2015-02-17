var emitter = require('events').EventEmitter;

var server = require('./server');
var http = server.http;
var io = require('socket.io')(http);

function Session(sessionSocket) {
    this.id = sessionSocket.id;
    this.socket = sessionSocket;
    this.game = null;
}

function SessionController() {
    this.sessions = {};
}

SessionController.prototype.init = function() {
    var self = this;

    io.on('connection', function (sessionSocket) {
        var session = new Session(sessionSocket);

        self.sessions[sessionSocket.id] = session;
        console.log('a user connected: session.id: ' + sessionSocket.id + ' rest of socket: ' + JSON.stringify(sessionSocket));

        sessionSocket.on('register', function(registerMsg){
            emitter.emit('register', registerMsg);

        });

        sessionSocket.on('createGame', function (msg) {
            console.log('creating game: ' + msg);
            var player = new Player(msg.playerId),
                game = self.createGame(msg.gameId, player, msg.options);

            session.game = game;
            io.emit('gameCreated', msg);
        });

        sessionSocket.on('joinGame', function (msg) {
            console.log('joining game: ' + msg);
            var player = new Player(msg.playerId),
                game = self.joinGame([msg.gameId], player);

            session.game = game;
            io.emit('gameCreated', msg);
        });

        sessionSocket.on('disconnect', function () {
            console.log('user disconnected');
            delete self.sessionMap[sessionSocket.id];
        });

    });
};