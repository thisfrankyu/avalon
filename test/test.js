/**
 * Created by frank on 1/31/15.
 */
var test = require('tape');
var _ = require('underscore');

var engine = require('../game/engine');
var Game = engine.Game;
var Player = require('../game/player');
var PLAYER_SETUP = require('../config/rules');
var VIEW = PLAYER_SETUP.VIEW;
var STAGES = engine.STAGES;

test('test that all the special roles passed in are included in the roles assigned', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });
    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }
    game._assignRoles();
    _.each(game.goodSpecialRoles, function (role) {
        t.ok(_.contains(_.values(game.roles), role), 'make sure ' + role + ' is in roles');
    });
    _.each(game.badSpecialRoles, function (role) {
        t.ok(_.contains(_.values(game.roles), role), 'make sure ' + role + ' is in roles');
    });
    t.end();
});

test('test malformed player', function (t) {
    var game = new Game('badPlayer', 'player0');

    t.throws(game.addPlayer.bind(game, {}), /malformed player/, 'make sure malformed player error is thrown');

    t.end();
});

test('test too many good special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 5; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /chose too many good special roles/, 'make sure you cannot provide too many good people');

    t.end();
});

test('test too many bad special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "MORGANA", "MORDRED", "OBERON"]
    });

    for (var i = 0; i < 5; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /chose too many bad special roles/, 'make sure you cannot provide too many bad people');

    t.end();
});

test('test invalid good special role', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "PHOEBE"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /is not a special role/, 'make sure you cannot provide a non-existent good role');

    t.end();
});

test('test invalid bad special role', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "FRANK"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /is not a special role/, 'make sure you cannot provide a non-existent bad role');

    t.end();
});

test('test duplicate good special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "MERLIN"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /Cannot provide duplicate special roles/, 'make sure you cannot provide duplicate good people');

    t.end();
});

test('test duplicate bad special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "ASSASSIN"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /Cannot provide duplicate special roles/, 'make sure you cannot provide duplicate bad people');

    t.end();
});

test('test player order', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(6, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });

    game.start();
    t.equal(game.playerOrder.length, players.length, 'Make sure there are the right number of players in the game');
    players.forEach(function (player) {
        t.ok(game.playerOrder.indexOf(player.id) !== -1, 'Each player should be given a spot in the order');
    });

    t.equal(game.currentKing(), game.playerOrder[0], 'The first player should be the king first');
    t.equal(game.stage, STAGES.SELECT_QUESTERS, 'The game stage after the game starts should be SELECT QUESTERS');

    t.end();
});

test('test player views (all special roles)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED", "MORGANA", "OBERON"]
        }),
        players = [];

    _.times(10, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });

    game.start();
    players.forEach(function (player) {
        if (!player.view.length) {
            t.deepEqual(player.view, VIEW[player.role], 'Test that the player who is ' + player.role + ' cannot see anyone');
        }

        _.each(player.view, function (viewed) {
            t.ok(VIEW[player.role].indexOf(game.roles[viewed]) !== -1, "Test that the player who is " +
            player.role + ' can see ' + viewed + ' (' + game.roles[viewed] + ')')
        });
    });

    t.end();
});

test('test player views (with regular minion)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED", "MORGANA"]
        }),
        players = [];

    _.times(10, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });

    game.start();
    players.forEach(function (player) {
        if (!player.view.length) {
            t.deepEqual(player.view, VIEW[player.role], 'Test that the player who is ' + player.role + ' cannot see anyone');
        }

        _.each(player.view, function (viewed) {
            t.ok(VIEW[player.role].indexOf(game.roles[viewed]) !== -1, "Test that the player who is " +
            player.role + ' can see ' + viewed + ' (' + game.roles[viewed] + ')')
        });
    });

    t.end();
});

test('test start game before 5 have joined)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(4, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });

    t.throws(game.start.bind(game), /Not enough players have joined yet/, 'Cannont start a game before at least 5 people have joined');


    t.end();
});

test('test add too many players', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(PLAYER_SETUP.maxNumberOfPlayers, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });

    t.throws(game.addPlayer.bind(game, new Player('playerX')), /cannot add more players than/, 'make sure that you cannot add more than ' + PLAYER_SETUP.maxNumberOfPlayers + ' players');
    t.end();
});

test('test add not enough players', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(4, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });
    t.throws(game.start.bind(game), /Not enough players have joined yet/, 'Cannot start a game before at least 5 people have joined');
    t.end();
});

test('test no adding players after game has started', function(t){
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(5, function (n) {
        players.push(new Player('player' + n))
        game.addPlayer(players[n]);
    });
    game.start();
    t.throws(game.addPlayer.bind(game, new Player('playerX')), /cannot add a player after the game has started/, 'cannot add a player after the game has started');
    t.end();
});