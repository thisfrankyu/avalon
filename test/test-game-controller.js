var test = require('tape');
var _ = require('underscore');

var GameController = require('../game/game-controller').GameController;
var newEmitter = require('../communication/emitter').newEmitter;
var RULES = require('../game/rules');
var BAD_ROLES = RULES.BAD_ROLES;
var GOOD_ROLES = RULES.GOOD_ROLES;
var STAGES = require('../game/engine').STAGES;
var quest = require('../game/quest');
var VOTE = quest.VOTE;
var QUEST_STATE = quest.QUEST_STATE;

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
    testEmitter.emit('registerPlayer', {playerId: 'player0', callback: callback});
    testEmitter.emit('registerPlayer', {playerId: 'player1'});
});

test('test register already registered player', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        playerId = 'player0';

    gameController.init();
    t.plan(2);
    testEmitter.once('error', function (error) {
        t.equal(error.message, 'playerId player0 has already been registered',
            'make sure an error was emitted');
    });
    testEmitter.emit('registerPlayer', {playerId: 'player0'});
    testEmitter.emit('registerPlayer', {
        playerId: 'player0',
        callback: function (error, msg) {
            t.equal(error.message, 'playerId player0 has already been registered',
                'make sure the error was returned to caller');
        }
    });
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

    });
    testEmitter.emit('registerPlayer', {playerId: playerId});
    testEmitter.once('error', function (e) {
        t.equal(e.message, 'game0 has already been created',
            'Should not be able to create a game that has been created already');
        t.end();
    });
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: playerId,
        gameOptions: {
            goodSpecialRoles: goodSpecialRoles,
            badSpecialRoles: badSpecialRoles
        },
        callback: callback
    });
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
    testEmitter.once('error', function (e) {
        t.equal(e.message, 'Game with gameId ' + gameId + ' not found',
            'Should not be able to join a game that has not been created yet');
    });
    testEmitter.once('gameJoined', function (msg) {
        t.equal(msg.joinedPlayerId, player1, 'make sure that joinedPlayerId is player1');
        t.equal(msg.gameId, gameId, 'make sure that the reported gameId is the correct gameId');
        t.ok(gameController.games[gameId].players.hasOwnProperty(player1), 'make sure player1 is in the game that was joined');
        t.end();
    });


    testEmitter.emit('registerPlayer', {playerId: ownerId});
    testEmitter.emit('registerPlayer', {playerId: player1});
    testEmitter.emit('joinGame', {gameId: gameId, playerId: player1});
    testEmitter.emit('createGame', {
        gameId: gameId,
        playerId: ownerId
    });
    testEmitter.emit('joinGame', {
        gameId: gameId, playerId: player1,
        callback: callback
    });

});


test('test startGame', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        errors = [];

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
            game = gameController.games[gameId],
            roles;

        t.equal(game.stage, STAGES.SELECT_QUESTERS,
            'Make sure the game has started and we are now in the SELECT_QUESTERS phase');
        _.each(_.values(msg.players), function (player) {
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

    testEmitter.on('error', function (e) {
        errors.push(e);
        if (errors.length >= 2) {
            t.equal(errors[0].message, 'Game with gameId gameX not found', 'Should not be able to start a game that does not exist');
            t.equal(errors[1].message, 'Only the owner may start the game', 'Should not be able to start a game if player is not the owner');
        }
    });

    testEmitter.emit('startGame', {gameId: 'gameX', playerId: ownerId});

    testEmitter.emit('startGame', {gameId: gameId, playerId: 'playerX'});

    testEmitter.emit('startGame', {
        gameId: gameId, playerId: ownerId,
        callback: callback
    });
});

test('test select/remove quester', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        errors = [],
        badGameId = 'gameX',
        currentKing;

    testEmitter.once('questerSelected', function (msg) {
        var game = gameController.games[gameId];
        t.equal(msg.gameId, gameId,
            'The gameId reported by quester selected should match th game we created');
        t.equal(msg.requestingPlayerId, currentKing,
            'The king should have been the one to select a player');
        t.equal(msg.selectedQuesterId, ownerId,
            'The selected quester should be the one we picked');
        t.deepEqual(game.currentQuest().selectedQuesters, [ownerId],
            'Make sure the quest has the right selected quester');
    });

    testEmitter.once('questerRemoved', function (msg) {
        var game = gameController.games[gameId];
        t.equal(msg.gameId, gameId,
            'The gameId reported by quester selected should match the game we created');
        t.equal(msg.requestingPlayerId, currentKing,
            'The king should have been the one to select a player');
        t.equal(msg.removedQuesterId, ownerId,
            'The removed quester should be the one we picked');
        t.deepEqual(game.currentQuest().selectedQuesters, [],
            'Make sure the quest has the right selected quester');
    });

    testEmitter.on('error', function (e) {
        errors.push(e);
        if (errors.length >= 2) {
            t.equal(errors[0].message, 'cannot add quester that has already been selected',
                'should not be able to select the same quester twice');
            t.equal(errors[1].message, 'Game with gameId ' + badGameId + ' not found',
                'should not be able to remove a quester from a game that does not exist');
            t.end();
        }
    });

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    currentKing = gameController.games[gameId].currentKing();

    testEmitter.emit('selectQuester', {
        playerId: ownerId,
        requestingPlayerId: currentKing,
        gameId: gameId,
        callback: callback
    });

    testEmitter.emit('selectQuester', {
        playerId: ownerId,
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('removeQuester', {
        playerId: ownerId,
        requestingPlayerId: currentKing,
        gameId: gameId,
        callback: callback
    });

    testEmitter.emit('removeQuester', {
        playerId: ownerId,
        requestingPlayerId: currentKing,
        gameId: badGameId
    });
});

test('test submit questers for voting', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        errors = [],
        selectedQuesters = ['player0', 'player1'],
        currentKing,
        game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    currentKing = game.currentKing();

    testEmitter.once('questersSubmitted', function (msg) {
        t.equal(msg.gameId, gameId,
            'The gameId reported by quester selected should match the game we created');
        t.deepEqual(msg.selectedQuesters, selectedQuesters,
            'The selected questers reported should match the questers selected');
        t.deepEqual(game.currentQuest().selectedQuesters, selectedQuesters,
            'The selected questers were written to the game state');
        t.equal(game.stage, STAGES.VOTE_ON_QUESTERS,
            'make sure that the game is in the VOTE_ON_QUESTERS stage after submitting questers');
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[0],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[1],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: gameId,
        callback: callback
    });

    t.end();
});

test('test vote on questers accepted', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        selectedQuesters = ['player0', 'player1'],
        currentKing,
        votedOnQuestersEventCounter = 0,
        game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    currentKing = game.currentKing();
    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[0],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[1],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.on('votedOnQuesters', function (msg) {
        votedOnQuestersEventCounter++;
        t.ok(_.has(game.players, msg.playerId), 'make sure that the playerId reported is one of the players in the game');
        t.equal(msg.vote, VOTE.ACCEPT,
            'make sure that the vote reported was VOTE.ACCEPT');
    });

    testEmitter.once('questAccepted', function (msg) {
        t.equal(_.keys(game.players).length, votedOnQuestersEventCounter,
            'make sure that we got a voted on event for every player in the game before resolving the vote');
        t.deepEqual(_.values(msg.votes), _.times(votedOnQuestersEventCounter, function () {
                return VOTE.ACCEPT;
            }),
            'make sure every vote is a ACCEPT');
        t.equal(game.stage, STAGES.QUEST,
            'make sure that after the quest is accepted the game stage is QUEST');
        t.end();
    });

    _.each(game.players, function (player, playerId) {
        testEmitter.emit('voteAcceptReject', {
            playerId: playerId,
            vote: VOTE.ACCEPT,
            gameId: gameId,
            callback: callback
        });
    });
});

test('test vote on questers rejected', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        selectedQuesters = ['player0', 'player1'],
        currentKing,
        votedOnQuestersEventCounter = 0,
        game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    currentKing = game.currentKing();
    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[0],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[1],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.on('votedOnQuesters', function (msg) {
        votedOnQuestersEventCounter++;
        t.ok(_.has(game.players, msg.playerId), 'make sure that the playerId reported is one of the players in the game');
        t.equal(msg.vote, VOTE.REJECT,
            'make sure that the vote reported was VOTE.REJECT');
    });

    testEmitter.once('questRejected', function (msg) {
        t.equal(_.keys(game.players).length, votedOnQuestersEventCounter,
            'make sure that we got a voted on event for every player in the game before resolving the vote');
        t.deepEqual(_.values(msg.votes), _.times(votedOnQuestersEventCounter, function () {
                return VOTE.REJECT;
            }),
            'make sure every vote is a REJECT');
        t.equal(game.stage, STAGES.SELECT_QUESTERS,
            'make sure that after the quest is rejected the game stage is SELECT_QUESTERS');
        t.end();
    });

    _.each(game.players, function (player, playerId) {
        testEmitter.emit('voteAcceptReject', {
            playerId: playerId,
            vote: VOTE.REJECT,
            gameId: gameId
        });
    });
});

test('test changing vote on questers', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        selectedQuesters = ['player0', 'player1'],
        currentKing,
        votedOnQuestersEventCounter = 0,
        game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    currentKing = game.currentKing();
    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[0],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[1],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.on('votedOnQuesters', function () {
        votedOnQuestersEventCounter++;
    });

    testEmitter.once('questRejected', function (msg) {
        t.equal(_.keys(game.players).length + 1, votedOnQuestersEventCounter,
            'make sure that we got a voted on event for every player in the game before resolving the vote plus one for the player who voted twice');
        t.equal(msg.votes['player3'], VOTE.REJECT,
            'make sure player3 was able to change vote to REJECT');
        t.equal(game.stage, STAGES.SELECT_QUESTERS,
            'make sure that after the quest is rejected the game stage is SELECT_QUESTERS');
        t.end();
    });

    _.times(4, function (i) {
        testEmitter.emit('voteAcceptReject', {
            playerId: 'player' + i,
            vote: VOTE.ACCEPT,
            gameId: gameId
        });
    });

    _.times(2, function (i) {
        testEmitter.emit('voteAcceptReject', {
            playerId: 'player' + (i + 4),
            vote: VOTE.REJECT,
            gameId: gameId
        });
    });

    testEmitter.emit('voteAcceptReject', {
        playerId: 'player3',
        vote: VOTE.REJECT,
        gameId: gameId
    });

    testEmitter.emit('voteAcceptReject', {
        playerId: 'player6',
        vote: VOTE.REJECT,
        gameId: gameId
    });
});


test('test vote on success/fail succeeded', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED'],
        selectedQuesters = ['player0', 'player1'],
        currentKing,
        votedOnQuestersEventCounter = 0,
        playerIds = [],
        game;

    t.plan(11);

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    currentKing = game.currentKing();
    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[0],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('selectQuester', {
        playerId: selectedQuesters[1],
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: gameId
    });

    _.each(game.players, function (player, playerId) {
        testEmitter.emit('voteAcceptReject', {
            playerId: playerId,
            vote: VOTE.ACCEPT,
            gameId: gameId
        });
    });

    testEmitter.on('votedOnSuccessFail', function (msg) {
        t.equal(msg.gameId, gameId, 'The game returned should match the one we created.');
        t.equal(msg.vote, VOTE.SUCCESS, 'The votes should both be SUCCESS.');
        playerIds.push(msg.playerId);

        if (playerIds.length === 2) {
            t.deepEqual(playerIds, selectedQuesters, 'The playerIds returned should match the order we sent them');
        }
    });

    testEmitter.once('questEnded', function (msg) {
        t.equal(msg.gameId, gameId, 'The game returned should match the one we created.');
        t.deepEqual(msg.votes, {player0: VOTE.SUCCESS, player1: VOTE.SUCCESS}, 'We should see all the success votes');
        t.equal(msg.questResult, QUEST_STATE.SUCCEEDED, 'After 2 SUCCESS votes, the quest should have succeeded');
        t.equal(msg.questIndex, 0, 'The quest that was just finished should have been the first one');
        t.equal(game.questIndex, 1, 'The quest index should have been incremented after the quest ended');
        t.equal(msg.nextQuest.result, QUEST_STATE.UNDECIDED, 'The next quest should not be decided yet');
    });

    testEmitter.emit('voteSuccessFail', {playerId: selectedQuesters[0], gameId: gameId, vote: VOTE.SUCCESS});
    testEmitter.emit('voteSuccessFail', {
        playerId: selectedQuesters[1],
        gameId: gameId,
        vote: VOTE.SUCCESS,
        callback: callback
    });
});


test('test attempt to kill Merlin (evil wins)', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED', 'ASSASSIN'],
        rolesToPlayers, assassinId, merlinId, game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    rolesToPlayers = _.invert(game.roles);
    assassinId = rolesToPlayers[BAD_ROLES.ASSASSIN];
    merlinId = rolesToPlayers[GOOD_ROLES.MERLIN];

    testEmitter.once('killMerlinStage', function (msg) {
        t.equal(msg.gameId, gameId, 'Should have the right game');
        t.equal(msg.stage, STAGES.KILL_MERLIN, 'We should get to the kill Merlin stage');
    });

    _.times(3, function () {
        goOnQuest(testEmitter, game);
    });

    testEmitter.once('merlinTargeted', function (msg) {
        t.equal(msg.targetId, merlinId, 'Targeted player should be the player we chose');
        t.equal(msg.requestingPlayerId, assassinId, 'Requesting player ID should be the ASSASSIN');
        t.equal(msg.gameId, gameId, 'The gameId should be that of this game');
    });

    testEmitter.once('killMerlinAttempted', function (msg) {
        t.equal(msg.gameId, gameId, 'The gameId should be that of this game');
        t.equal(msg.requestingPlayerId, assassinId, 'The requesting player should be the ASSASSIN');
        t.equal(msg.stage, STAGES.BAD_WINS, 'Bad should win because the ASSASSIN killed MERLIN');
        t.end();
    });

    testEmitter.emit('targetMerlin', {
        targetId: merlinId,
        requestingPlayerId: assassinId,
        gameId: gameId,
        callback: callback
    });
    testEmitter.emit('killMerlin', {
        requestingPlayerId: assassinId,
        gameId: gameId,
        callback: callback
    });
});


test('test attempt to kill Merlin (good wins)', function (t) {
    var testEmitter = newEmitter(),
        gameController = new GameController(testEmitter),
        gameId = 'game0',
        ownerId = 'player0',
        goodSpecialRoles = ['MERLIN', 'PERCIVAL'],
        badSpecialRoles = ['MORGANA', 'MORDRED', 'ASSASSIN'],
        rolesToPlayers, assassinId, merlinId, game;

    initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles);

    game = gameController.games[gameId];
    rolesToPlayers = _.invert(game.roles);
    assassinId = rolesToPlayers[BAD_ROLES.ASSASSIN];
    merlinId = rolesToPlayers[GOOD_ROLES.PERCIVAL];

    testEmitter.once('killMerlinStage', function (msg) {
        t.equal(msg.gameId, gameId, 'Should have the right game');
        t.equal(msg.stage, STAGES.KILL_MERLIN, 'We should get to the kill Merlin stage');
    });

    _.times(3, function () {
        goOnQuest(testEmitter, game);
    });

    testEmitter.once('merlinTargeted', function (msg) {
        t.equal(msg.targetId, merlinId, 'Targeted player should be the player we chose');
        t.equal(msg.requestingPlayerId, assassinId, 'Requesting player ID should be the ASSASSIN');
        t.equal(msg.gameId, gameId, 'The gameId should be that of this game');
    });

    testEmitter.once('killMerlinAttempted', function (msg) {
        t.equal(msg.gameId, gameId, 'The gameId should be that of this game');
        t.equal(msg.requestingPlayerId, assassinId, 'The requesting player should be the ASSASSIN');
        t.equal(msg.stage, STAGES.GOOD_WINS, 'Good should win because the ASSASSIN did not kill MERLIN');
        t.end();
    });

    testEmitter.emit('targetMerlin', {
        targetId: merlinId,
        requestingPlayerId: assassinId,
        gameId: gameId,
        callback: callback
    });
    testEmitter.emit('killMerlin', {
        requestingPlayerId: assassinId,
        gameId: gameId,
        callback: callback
    });
});

function initGame(gameController, testEmitter, ownerId, gameId, goodSpecialRoles, badSpecialRoles) {
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

    testEmitter.emit('startGame', {gameId: gameId, playerId: ownerId});
}

function goOnQuest(testEmitter, game) {
    var currentKing,
        numQuesters = game.currentQuest().numPlayers,
        players = Object.keys(game.players);

    currentKing = game.currentKing();
    _.times(numQuesters, function (i) {
        testEmitter.emit('selectQuester', {
            playerId: players[i],
            requestingPlayerId: currentKing,
            gameId: game.id
        });
    });

    testEmitter.emit('submitQuesters', {
        requestingPlayerId: currentKing,
        gameId: game.id
    });

    _.each(game.players, function (player, playerId) {
        testEmitter.emit('voteAcceptReject', {
            playerId: playerId,
            vote: VOTE.ACCEPT,
            gameId: game.id
        });
    });

    _.times(numQuesters, function (i) {
        testEmitter.emit('voteSuccessFail', {
            playerId: players[i],
            gameId: game.id,
            vote: VOTE.SUCCESS,
            callback: callback
        });
    });
}

function callback(error, msg) {
}
