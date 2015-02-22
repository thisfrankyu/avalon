var test = require('tape');
var _ = require('underscore');
var async = require('async');

var GameController = require('../game/game-controller').GameController;
var newEmitter = require('../communication/emitter').newEmitter;


test('test registerPlayer', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        playerId = 'player0',
        badSpecialRoles = [];

    gameController.init();
    t.plan(2);
    testEmitter.on('playerRegistered', function (msg) {
        t.ok(gameController.players.hasOwnProperty(msg.playerId),
            'After registerPlayer is emitted, there should be a player in the gameController');

    });
    testEmitter.emit('registerPlayer', {playerId: 'player0'});
    testEmitter.emit('registerPlayer', {playerId: 'player1'});
});

test('test createGame', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        playerId = 'player0',
        badSpecialRoles = [];
    gameController.init();

    testEmitter.once('gameCreated', function (msg) {
        t.ok(gameController.games.hasOwnProperty(gameId), 'make sure a game has been created with the right gameId');
        t.equal(msg.gameId, gameId, 'make sure that the gameId is reported correctly');
        t.equal(gameController.games[gameId].ownerId, playerId, 'make sure the owner of the game is the playerId that created it');
        t.equal(msg.ownerId, playerId, 'make sure the owner of the game is correctly reported');
        t.end();
    });
    testEmitter.emit('registerPlayer', {playerId: playerId});
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: playerId
    });
});

test('test joinGame', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        badSpecialRoles = [],
        player1 = 'player1';
    gameController.init();

    testEmitter.once('gameJoined', function (msg) {
        t.equal(msg.joinedPlayerId, player1, 'make sure that joinedPlayerId is player1');
        t.equal(msg.gameId, gameId, 'make sure that the reported gameId is the correct gameId');
        t.ok(gameController.games[gameId].players.hasOwnProperty(player1), 'make sure player1 is in the game that was joined');
        t.end();
    });


    testEmitter.emit('registerPlayer', {playerId: ownerId});
    testEmitter.emit('registerPlayer', {playerId: player1});
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: ownerId
    });
    testEmitter.emit('joinGame', {gameId: gameId, playerId: player1});

});