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
    socket.on('registerPlayerSucceeded', function (msg) {
        if (_.has(msg, 'sessionId')) {
            session = sessionController.sessions[sessionId];
            t.equal(session.playerId, playerId,
                'make sure that ' + playerId + ' was successfully registered in session controller');
            t.end();
        }
    });
    testEmitter.once('registerPlayer', function (msg) {
        var response = {playerId: msg.playerId};
        msg.callback(null, response);
        testEmitter.emit('playerRegistered', response);
    });
    socket.emit('registerPlayer', {playerId: playerId});
    testEmitter.once('registerPlayer', function (msg) {
        var error = new Error('playerId ' + playerId + ' has already been registered');
        msg.callback(error);
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
            gameOptions: msg.gameOptions
        };
        msg.callback(null, response);
        testEmitter.emit('gameCreated', response);
    });
    socket.once('createGameSucceeded', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            gameOptions: {
                goodSpecialRoles: goodSpecialRoles,
                badSpecialRoles: badSpecialRoles
            },
            sessionId: sessionId
        }, 'make sure the right gameId was created');
    });
    socket.emit('createGame', {gameId: gameId});
    socket.emit('registerPlayer', {playerId: playerId});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
    socket.once('createGameFailed', function (error) {
        t.equal(error.message, gameId + ' has already been created', 'make sure createGameFailed sent back to user');
        t.end();
    });
    testEmitter.once('createGame', function (msg) {
        var error = new Error(gameId + ' has already been created');
        msg.callback(error);
    });
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

    testEmitter.once('joinGame', function (msg) {
        players.push(msg.playerId);
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

    socket.once('joinGameSucceeded', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            ownerId: ownerId,
            joinedPlayerId: player1,
            players: [playerId, player1],
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles,
            sessionId: sessionId
        }, 'make sure ' + player1 + ' joins the game correctly');
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
    testEmitter.once('joinGame', function (msg) {
        var error = new Error('random error from join game');
        testEmitter.emit('error', error);
        msg.callback(error);
    });
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'random error from join game', 'make sure that failing on join game gets back to client');
    });
    socket.once('joinGameFailed', function (error) {
        t.equal(error.message, 'random error from join game', 'make sure that failing on join game gets back to client');
        t.end();
    });
    socket.emit('joinGame', {gameId: gameId, playerId: player1});
});


test('test start game', function (t) {
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
        sockets = [socket],
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


    socket.emit('registerPlayer', {playerId: playerId});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
    _.times(6, function (n) {
        var i = n + 1;
        sockets.push(new Socket('sessionSocket' + i));
        io.emit('connection', sockets[i]);
        sockets[i].emit('registerPlayer', {playerId: 'player' + i});
        sockets[i].emit('joinGame', {gameId: gameId, playerId: 'player' + i});
    });
    testEmitter.on('startGame', function (msg) {
        msg.callback(null, {
            gameId: gameId,
            players: players,
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles
        });
    });
    socket.once('startGameSucceeded', function (msg) {
        t.deepEqual(msg, {
                gameId: gameId,
                players: players,
                badSpecialRoles: badSpecialRoles,
                goodSpecialRoles: goodSpecialRoles,
                sessionId: sessionId
            },
            'make sure game is started with all the right players and roles');
        t.equal(msg.players.length, 7, 'make sure all the players are joined');
        t.end();
    });
    socket.emit('startGame', {gameId: gameId});
});

test('test select and remove questers', function (t) {
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
        sockets = [socket],
        sessionController = new SessionController(testEmitter, io),
        players = [];
    initGame(sessionController, io, socket, testEmitter, players, ownerId, gameId, badSpecialRoles, goodSpecialRoles, playerId, sockets);
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'error on selectQuester',
            'make sure error on selectQuester gets emitted');
    });
    errorOnce('selectQuester', testEmitter, socket, t, gameId);

    testEmitter.on('selectQuester', function (msg) {
        var response = {
            gameId: msg.gameId,
            selectedQuesterId: msg.playerId,
            requestingPlayerId: msg.requestingPlayerId
        }
        msg.callback(null, response);
        testEmitter.emit('questerSelected', response);
    });
    t.end();
});

function initGame(sessionController, io, socket, testEmitter, players, ownerId, gameId, badSpecialRoles, goodSpecialRoles, playerId, sockets) {
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


    socket.emit('registerPlayer', {playerId: playerId});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
    _.times(6, function (n) {
        var i = n + 1;
        sockets.push(new Socket('sessionSocket' + i));
        io.emit('connection', sockets[i]);
        sockets[i].emit('registerPlayer', {playerId: 'player' + i});
        sockets[i].emit('joinGame', {gameId: gameId, playerId: 'player' + i});
    });
    testEmitter.on('startGame', function (msg) {
        msg.callback(null, {
            gameId: gameId,
            players: players,
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles
        });
    });
    socket.emit('startGame', {gameId: gameId});
}

function errorOnce(eventName, testEmitter, socket, t, gameId) {
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'error on ' + eventName,
            'make sure error on ' + eventName + ' gets emitted');
    });
    socket.once(eventName + 'Failed', function (error) {
        t.equal(error.message, 'error on ' + eventName,
            'make sure ' + eventName + 'Failed gets emitted');
    });
    testEmitter.once(eventName, function (msg) {
        var error = new Error('error on ' + eventName);
        msg.callback(error);
        testEmitter.emit('error', error);
    });
    socket.emit(eventName, {gameId: gameId});
}
