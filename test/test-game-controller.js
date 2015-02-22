var test = require('tape');
var _ = require('underscore');
var async = require('async');

var GameController = require('../game/game-controller').GameController;
var newEmitter = require('../communication/emitter').newEmitter;
var STAGES = require('../game/engine').STAGES;


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
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'];

    gameController.init();

    testEmitter.once('gameCreated', function (msg) {
        var game = gameController.games[gameId],
            roles;

        t.ok(gameController.games.hasOwnProperty(gameId), 'make sure a game has been created with the right gameId');
        t.equal(msg.gameId, gameId, 'make sure that the gameId is reported correctly');
        t.equal(game.ownerId, playerId, 'make sure the owner of the game is the playerId that created it');
        t.equal(msg.ownerId, playerId, 'make sure the owner of the game is correctly reported');
        t.end();
    });
    testEmitter.emit('registerPlayer', {playerId: playerId});
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: playerId,
        gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
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


test('test startGame', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'];

    gameController.init();

    testEmitter.emit('registerPlayer', {playerId: ownerId});
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: ownerId,
        gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        }
    });

    _.times(6, function (n) {
        var playerId = 'player' + (n + 1);
        testEmitter.emit('registerPlayer', {playerId: playerId});
        testEmitter.emit('joinGame', {gameId: gameId, playerId: playerId});
    });

    testEmitter.once('gameStarted', function (msg) {
        var gameId = msg.gameId,
            game = msg.game,
            roles;

        t.equal(game.stage, STAGES.SELECT_QUESTERS,
            'Make sure the game has started and we are now in the SELECT_QUESTERS phase');
        _.each(_.values(game.players), function (player) {
            t.notEqual(player.role, null,
                'Make sure each player has a role: ' + player.id + ' is ' + player.role);
        });

        roles = _.pluck(_.values(game.players), 'role');
        _.each(goodSpecialRoles, function (specialRole) {
            t.ok(_.contains(roles, specialRole), 'Make sure ' + specialRole + ' is assigned to a player');
        });
        _.each(badSpecialRoles, function (specialRole) {
            t.ok(_.contains(roles, specialRole), 'Make sure ' + specialRole + ' is assigned to a player');
        });

        t.end();
    });

    t.throws(gameController._handleStartGame.bind(gameController, {gameId: 'gameX', playerId: ownerId}),
        /Game with gameId gameX not found/, 'Should not be able to start a game that does not exist');
    t.throws(gameController._handleStartGame.bind(gameController, {gameId: gameId, playerId: 'playerX'}),
        /Only the owner may start the game/, 'Should not be able to start a game if player is not the owner');

    testEmitter.emit('startGame', {gameId: gameId, playerId: ownerId});
});