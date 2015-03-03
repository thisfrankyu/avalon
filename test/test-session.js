var test = require('tape');
var _ = require('underscore');
var util = require('util');
var SessionController = require('../session/session').SessionController;
var EventEmitter = require('events').EventEmitter;
var newEmitter = require('../communication/emitter').newEmitter;

function Socket(id) {
    this.id = id;
}
util.inherits(Socket, EventEmitter);

test('test connect to session', function (t) {
    var sessionId = 'sessionSocket0',
        testEmitter = newEmitter(),
        io = new Socket('io'),
        socket = new Socket(sessionId),
        sessionController = new SessionController(testEmitter, io);
    sessionController.init();
    socket.once('hi', function () {
        t.ok(true, 'socket should have emitted hi upon io getting connection');
        t.equal(sessionController.sessions[sessionId].id, sessionId,
            'make sure that the session was registered with the sessionController');
        t.end();
    });
    io.emit('connection', socket);
});

test('test register player', function (t) {
    var sessionId = 'sessionSocket0',
        playerId = 'player0',
        testEmitter = newEmitter(),
        io = new Socket('io'),
        socket = new Socket(sessionId),
        sessionController = new SessionController(testEmitter, io),
        session;

    sessionController.init();
    io.emit('connection', socket);
    socket.on('playerRegistered', function (msg) {
        if (_.has(msg, 'sessionId')) {
            session = sessionController.sessions[sessionId];
            t.equal(session.playerId, playerId,
                'make sure that ' + playerId + ' was successfully registered in session controller');
            t.end();
        }
    });
    testEmitter.on('registerPlayer', function (msg) {
        var response = {playerId: msg.playerId};
        msg.callback(null, response);
        testEmitter.emit('playerRegistered', response);
    });
    socket.emit('registerPlayer', {playerId: playerId});

});


test('test create game', function (t) {
    var sessionId = 'sessionSocket0',
        playerId = 'player0',
        gameId = 'game0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        testEmitter = newEmitter(),
        io = new Socket('io'),
        socket = new Socket(sessionId),
        sessionController = new SessionController(testEmitter, io),
        session;

    sessionController.init();
    io.emit('connection', socket);
    testEmitter.on('registerPlayer', function (msg) {
        var response = {playerId: msg.playerId};
        msg.callback(null, response);
        testEmitter.emit('playerRegistered', response);
    });

    testEmitter.once('error', function (error) {
        t.equal(error.message, 'session ' + sessionId + ' is not registered',
            'make sure that calling createGame before registering is not allowed');
    });
    testEmitter.once('createGame', function (msg) {
        var response = {
            gameId: msg.gameId,
            badSpecialRoles: msg.badSpecialRoles,
            goodSpecialRoles: msg.goodSpecialRoles
        };
        msg.callback(null, response);
        testEmitter.emit('gameCreated', response);
    });
    socket.once('gameCreated', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }, 'make sure the right gameId was created');
        t.end();
    });
    socket.emit('createGame', {gameId: gameId});
    socket.emit('registerPlayer', {playerId: playerId});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
});

test('test join game', function (t) {
    var sessionId = 'sessionSocket0',
        playerId = 'player0',
        ownerId = playerId,
        player1 = 'player1',
        gameId = 'game0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        testEmitter = newEmitter(),
        io = new Socket('io'),
        socket = new Socket(sessionId),
        sessionController = new SessionController(testEmitter, io),
        players = [];

    sessionController.init();
    io.emit('connection', socket);
    testEmitter.on('registerPlayer', function (msg) {
        var response = {playerId: msg.playerId};
        msg.callback(null, response);
        testEmitter.emit('playerRegistered', response);
    });

    testEmitter.once('createGame', function (msg) {
        players.push(ownerId);
        var response = {
            gameId: msg.gameId,
            badSpecialRoles: msg.badSpecialRoles,
            goodSpecialRoles: msg.goodSpecialRoles
        };
        msg.callback(null, response);
        testEmitter.emit('gameCreated', response);
    });

    testEmitter.on('joinGame', function (msg) {
        players.push(msg.playerId);
        console.log('*** players', players, 'msg', msg);
        var response = {
            gameId: gameId,
            ownerId: ownerId,
            joinedPlayerId: msg.playerId,
            players: players,
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles
        };
        msg.callback(null, response);
        testEmitter.emit('gameJoined', response);
    });

    socket.once('gameJoined', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            ownerId: ownerId,
            joinedPlayerId: player1,
            players: [playerId, player1],
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles,
            sessionId: sessionId
        }, 'make sure ' + player1 + ' joins the game correctly');
        t.end();
    });




    socket.emit('registerPlayer', {playerId: playerId});
    socket.emit('registerPlayer', {playerId: player1});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
    socket.emit('joinGame', {gameId: gameId, playerId: player1});
});
