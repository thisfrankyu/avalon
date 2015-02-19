var test = require('tape');
var _ = require('underscore');
var async = require('async');


var GameController = require('../game/game-controller').GameController;
var testEmitter = require('../communication/emitter');


test(function (t) {
    var gameController = new GameController();
    gameController.init();
    testEmitter.once('playerRegistered', function(msg) {
        t.ok(gameController.players.hasOwnProperty(msg.playerId),
            'After registerPlayer is emitted, there should be on the gameController');
        t.end();
    });
    testEmitter.emit('registerPlayer', {playerId: 'player0'});
});