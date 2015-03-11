var test = require('tape');
var _ = require('underscore');
var util = require('util');
var SessionController = require('../session/session').SessionController;
var EventEmitter = require('events').EventEmitter;
var newEmitter = require('../communication/emitter').newEmitter;
var VOTE = require('../game/quest').VOTE;
var QUEST_STATE = require('../game/quest').QUEST_STATE;
var STAGES = require('../game/engine').STAGES;
var Player = require('../game/player');

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
        socket1 = new Socket('sessionSocket1'),
        sessionController = new SessionController(testEmitter, io),
        session;

    t.plan(6);
    sessionController.init();
    io.emit('connection', socket);
    io.emit('connection', socket1);
    errorOnce('registerPlayer', testEmitter, socket, t, {playerId: 'playerX'});
    socket.on('registerPlayerAck', function (msg) {
        if (_.has(msg, 'sessionId')) {
            session = sessionController.sessions[sessionId];
            t.equal(session.playerId, playerId,
                'make sure that ' + playerId + ' was successfully registered in session controller');
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
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'session already has a playerId player0',
            'make sure error was thrown for already registered player');
    });
    socket1.once('registerPlayerNack', function (msg) {
        t.ok(msg, 'We should not be able to register with an ID that is already being used');
    });
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'session already has a playerId player0',
            'make sure error was thrown for already registered player');
    });
    socket.emit('registerPlayer', {playerId: playerId});
    socket1.emit('registerPlayer', {playerId: playerId});
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
    socket.once('createGameAck', function (msg) {
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
    socket.once('createGameNack', function (errorMessage) {
        t.equal(errorMessage, gameId + ' has already been created', 'make sure createGameFailed sent back to user');
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
        sessionId1 = 'sessionSocket1',
        playerId = 'player0',
        ownerId = playerId,
        player1 = 'player1',
        gameId = 'game0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        testEmitter = newEmitter(),
        io = new Socket('io'),
        socket = new Socket(sessionId),
        socket1 = new Socket(sessionId1),
        sessionController = new SessionController(testEmitter, io),
        players = [];

    sessionController.init();
    io.emit('connection', socket);
    io.emit('connection', socket1);
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

    socket1.once('joinGameAck', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            ownerId: ownerId,
            joinedPlayerId: player1,
            players: [playerId, player1],
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles,
            sessionId: sessionId1
        }, 'make sure ' + player1 + ' joins the game correctly');
    });

    socket.emit('registerPlayer', {playerId: playerId});
    socket1.emit('registerPlayer', {playerId: player1});
    socket.emit('createGame', {
        gameId: gameId, gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });
    socket1.emit('joinGame', {gameId: gameId, playerId: player1});
    testEmitter.once('joinGame', function (msg) {
        var error = new Error('random error from join game');
        testEmitter.emit('error', error);
        msg.callback(error);
    });
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'random error from join game', 'make sure that failing on join game gets back to client');
    });
    socket1.once('joinGameNack', function (errorMessage) {
        t.equal(errorMessage, 'random error from join game', 'make sure that failing on join game gets back to client');
        t.end();
    });
    socket1.emit('joinGame', {gameId: gameId, playerId: player1});
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
    errorOnce('startGame', testEmitter, socket, t, {gameId: gameId});
    _.times(6, function (n) {
        var i = n + 1;
        sockets.push(new Socket('sessionSocket' + i));
        io.emit('connection', sockets[i]);
        sockets[i].emit('registerPlayer', {playerId: 'player' + i});
        sockets[i].emit('joinGame', {gameId: gameId, playerId: 'player' + i});
    });


    var playersMap = _.reduce(players, function (memo, num) {
        memo[num] = new Player(num);
        return memo;
    }, {});
    testEmitter.on('startGame', function (msg) {
        var response = {
            gameId: gameId,
            players: playersMap,
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles
        };
        msg.callback(null, response);
        testEmitter.emit('gameStarted', response);
    });

    socket.once('startGameAck', function (msg) {
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
    errorOnce('selectQuester', testEmitter, socket, t, {gameId: gameId, playerId: playerId});
    errorOnce('removeQuester', testEmitter, socket, t, {gameId: gameId, playerId: 'playerX'});
    errorOnce('submitQuesters', testEmitter, socket, t, {gameId: gameId});
    testEmitter.on('selectQuester', function (msg) {
        var response = {
            gameId: msg.gameId,
            selectedQuesterId: msg.playerId,
            requestingPlayerId: msg.requestingPlayerId,
            playerId: playerId
        };
        msg.callback(null, response);
        testEmitter.emit('questerSelected', response);
    });
    testEmitter.once('submitQuesters', function (msg) {
        var response = {
            gameId: gameId,
            selectedQuesters: [playerId, player1]
        };
        msg.callback(null, response);
        testEmitter.emit('questersSubmitted', response);
    });
    socket.once('selectQuesterAck', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            selectedQuesterId: playerId,
            requestingPlayerId: playerId,
            sessionId: sessionId
        }, 'make sure the correct quester is selected');
    });
    socket.emit('selectQuester', {gameId: gameId, playerId: playerId});
    testEmitter.on('removeQuester', function (msg) {
        var response = {
            gameId: msg.gameId,
            removedQuesterId: msg.playerId,
            requestingPlayerId: msg.requestingPlayerId,
            playerId: playerId
        };
        msg.callback(null, response);
        testEmitter.emit('questerSelected', response);
    });
    socket.once('removeQuesterAck', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            removedQuesterId: playerId,
            requestingPlayerId: playerId,
            sessionId: sessionId
        }, 'make sure the correct quester is removed');
    });
    socket.emit('removeQuester', {gameId: gameId, playerId: playerId});
    socket.emit('selectQuester', {gameId: gameId, playerId: player1});
    socket.on('submitQuestersAck', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            selectedQuesters: [playerId, player1],
            sessionId: sessionId
        }, 'make sure we can submit questers');
        t.end();
    });
    socket.emit('submitQuesters', {gameId: gameId});
});


test('test voteAcceptReject', function (t) {
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
        players = [],
        selectedQuesters = [],
        votes = {};

    t.plan(18);
    initGame(sessionController, io, socket, testEmitter, players, ownerId, gameId, badSpecialRoles, goodSpecialRoles, playerId, sockets);
    testEmitter.on('selectQuester', function (msg) {
        var response = {
            gameId: msg.gameId,
            selectedQuesterId: msg.playerId,
            requestingPlayerId: msg.requestingPlayerId,
            playerId: playerId
        };
        selectedQuesters.push(msg.playerId);
        msg.callback(null, response);
        testEmitter.emit('questerSelected', response);
    });
    errorOnce('voteAcceptReject', testEmitter, socket, t, {gameId: gameId, playerId: playerId, vote: 2});
    testEmitter.once('submitQuesters', function (msg) {
        var response = {
            gameId: gameId,
            selectedQuesters: [playerId, player1]
        };
        msg.callback(null, response);
        testEmitter.emit('questersSubmitted', response);
    });
    testEmitter.on('voteAcceptReject', function (msg) {
        var response = {
            gameId: msg.gameId,
            playerId: msg.playerId,
            vote: msg.vote
        };
        votes[msg.playerId] = msg.vote;
        msg.callback(null, response);
        testEmitter.emit('votedOnQuesters', response);
        if (Object.keys(votes).length >= 7) {
            var netAccepts = _.reduce(votes, function (memo, num) {
                return memo + num;
            }, 0);
            if (netAccepts > 0) {
                votes = {};
                testEmitter.emit('questAccepted', {
                    gameId: gameId,
                    players: selectedQuesters,
                    votes: votes
                });
            } else {
                votes = {};
                testEmitter.emit('questRejected', {
                    gameId: gameId,
                    players: selectedQuesters,
                    votes: votes
                });
            }
        }

    });

    testEmitter.once('questAccepted', function (msg) {
        t.ok(msg, 'Make sure the quest was accepted after 7 ACCEPT votes');
    });
    testEmitter.once('questRejected', function (msg) {
        t.ok(msg, 'Make sure the quest was rejected after 7 REJECT votes');
    });
    socket.emit('selectQuester', {gameId: gameId, playerId: playerId});
    socket.emit('selectQuester', {gameId: gameId, playerId: player1});
    socket.emit('submitQuesters', {gameId: gameId});
    _.times(7, function (i) {
        sockets[i].once('voteAcceptRejectAck', function (msg) {
            t.deepEqual(msg, {gameId: gameId, playerId: players[i], vote: VOTE.REJECT, sessionId: sockets[i].id},
                'Make sure the reject vote is correctly reported');
        });
        sockets[i].emit('voteAcceptReject', {gameId: gameId, playerId: players[i], vote: VOTE.REJECT});
    });
    sockets[1].emit('selectQuester', {gameId: gameId, playerId: playerId});
    sockets[1].emit('selectQuester', {gameId: gameId, playerId: player1});
    sockets[1].emit('submitQuesters', {gameId: gameId});
    _.times(7, function (i) {
        sockets[i].once('voteAcceptRejectAck', function (msg) {
            t.deepEqual(msg, {gameId: gameId, playerId: players[i], vote: VOTE.ACCEPT, sessionId: sockets[i].id},
                'Make sure the accept vote is correctly reported');
        });
        sockets[i].emit('voteAcceptReject', {gameId: gameId, playerId: players[i], vote: VOTE.ACCEPT});
    });
});


test('test voteSuccessFail', function (t) {
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
        players = [],
        selectedQuesters = [playerId, player1],
        votes = {};

    initGame(sessionController, io, socket, testEmitter, players, ownerId, gameId, badSpecialRoles, goodSpecialRoles, playerId, sockets);
    errorOnce('voteSuccessFail', testEmitter, socket, t, {gameId: gameId, playerId: playerId, vote: 2});
    testEmitter.on('voteSuccessFail', function (msg) {
        var response = {gameId: gameId, playerId: msg.playerId, vote: msg.vote};

        votes[msg.playerId] = msg.vote;
        msg.callback(null, response);
        testEmitter.emit('votedOnSuccessFail', response);
        if (_.keys(votes).length >= selectedQuesters.length) {
            var numFails = _.reduce(votes, function (memo, num) {
                return memo + (num === VOTE.FAIL ? 1 : 0);
            }, 0);
            var questResult = numFails < 1 ? QUEST_STATE.SUCCEEDED : QUEST_STATE.FAILED;
            testEmitter.emit('questEnded', {
                gameId: gameId,
                votes: votes,
                questResult: questResult
            });
        }
    });
    sockets[0].once('voteSuccessFailAck', function (msg) {
        t.deepEqual(msg, {gameId: gameId, playerId: playerId, vote: VOTE.SUCCESS, sessionId: 'sessionSocket0'},
            'Make sure player0 has his vote reported correctly');
    });
    sockets[1].once('voteSuccessFailAck', function (msg) {
        t.deepEqual(msg, {gameId: gameId, playerId: player1, vote: VOTE.SUCCESS, sessionId: 'sessionSocket1'},
            'Make sure player1 has his vote reported correctly');
    });
    testEmitter.once('questEnded', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            votes: {player0: VOTE.SUCCESS, player1: VOTE.SUCCESS},
            questResult: QUEST_STATE.SUCCEEDED
        }, 'Make sure the quest result is SUCCESS');
    });
    sockets[0].emit('voteSuccessFail', {gameId: gameId, vote: VOTE.SUCCESS});
    sockets[1].emit('voteSuccessFail', {gameId: gameId, vote: VOTE.SUCCESS});
    votes = {};
    testEmitter.once('questEnded', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            votes: {player0: VOTE.FAIL, player1: VOTE.SUCCESS},
            questResult: QUEST_STATE.FAILED
        }, 'Make sure the quest result is FAILED');
        t.end();
    });

    sockets[0].emit('voteSuccessFail', {gameId: gameId, vote: VOTE.FAIL});
    sockets[1].emit('voteSuccessFail', {gameId: gameId, vote: VOTE.SUCCESS});

});


test('test voteSuccessFail', function (t) {
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
        players = [],
        selectedQuesters = [playerId, player1],
        votes = {};

    initGame(sessionController, io, socket, testEmitter, players, ownerId, gameId, badSpecialRoles, goodSpecialRoles, playerId, sockets);
    errorOnce('targetMerlin', testEmitter, socket, t, {
        gameId: gameId,
        requestingPlayerId: playerId,
        targetId: 'playerX'
    });
    errorOnce('killMerlin', testEmitter, socket, t, {gameId: gameId, requestingPlayerId: playerId});
    testEmitter.on('targetMerlin', function (msg) {
        var response = {
            targetId: msg.targetId,
            requestingPlayerId: msg.requestingPlayerId,
            gameId: msg.gameId
        };
        msg.callback(null, response);
        testEmitter.emit('merlinTargeted', response);
    });
    testEmitter.once('killMerlin', function (msg) {
        var response = {
            requestingPlayerId: msg.requestingPlayerId,
            gameId: gameId,
            stage: STAGES.BAD_WINS
        };
        msg.callback(null, response);
        testEmitter.emit('killMerlinAttempted', response);
    });
    socket.once('targetMerlinAck', function (msg) {
        t.deepEqual(msg, {
            gameId: gameId,
            requestingPlayerId: playerId,
            targetId: player1,
            sessionId: sessionId
        }, 'make sure that targetMerlinSucceeded is reported correctly');
    });
    socket.once('killMerlinAttemptAck', function (msg) {
        t.deepEqual(msg, {
                gameId: gameId,
                requestingPlayerId: playerId,
                stage: STAGES.BAD_WINS,
                sessionId: sessionId
            },
            'make sure killMerlinAttemptSucceeded is reported correctly');
        t.end();
    });
    socket.emit('targetMerlin', {gameId: gameId, targetId: player1});
    socket.emit('killMerlin', {gameId: gameId});
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
    var playersMap = _.reduce(players, function (memo, num) {
        memo[num] = num;
        return memo;
    }, {});
    testEmitter.on('startGame', function (msg) {
        var response = {
            gameId: gameId,
            players: playersMap,
            badSpecialRoles: badSpecialRoles,
            goodSpecialRoles: goodSpecialRoles
        };
        msg.callback(null, response);
        testEmitter.emit('gameStarted', response);
    });
    socket.emit('startGame', {gameId: gameId});
}

function errorOnce(eventName, testEmitter, socket, t, msg) {
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'error on ' + eventName,
            'make sure error on ' + eventName + ' gets emitted');
    });
    socket.once(eventName + 'Nack', function (errorMessage) {
        t.equal(errorMessage, 'error on ' + eventName,
            'make sure ' + eventName + 'Failed gets emitted');
    });
    testEmitter.once(eventName, function (msg) {
        var error = new Error('error on ' + eventName);
        msg.callback(error);
        testEmitter.emit('error', error);
    });
    socket.emit(eventName, msg);
}
