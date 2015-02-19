/**
 * Created by frank on 2/1/15.
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');

var engine = require('./engine');
var Player = require('./player');
var Game = engine.Game;
var emitter = require('../communication/emitter');

function GameController() {
    this.sessions = {};
    this.games = {};
    this.players = {};
}


GameController.prototype.createGame = function (gameId, player, options) {
    var game = new Game(gameId, options);
    this.games[gameId] = game;
    game.addPlayer(player);

    return game;
};

GameController.prototype.joinGame = function (gameId, player) {
    var game = this.games[gameId];

    try {
        game.addPlayer(player);
    } catch (err) {
        throw new Error('');
    }

    return game;
};


GameController.prototype._handleRegisterPlayer = function(msg) {
    var playerId = msg.playerId;
    this.players[playerId] = new Player(playerId);
    emitter.emit('playerRegistered', {playerId: playerId});
};


GameController.prototype.init = function () {
    var self = this;
    emitter.on('registerPlayer', self._handleRegisterPlayer.bind(self));
    emitter.on('createGame', function (msg) {
        var game = self.createGame(msg.gameId, self.players[msg.playerId], msg.gameOptions);
        emitter.emit('gameCreated', {
            gameId: game.id,
            ownerId: game.ownerId,
            badSpecialRoles: game.badSpecialRoles,
            goodSpecialRoles: game.goodSpecialRoles
        });
    });
    emitter.on('joinGame', function(msg){
        var game = self.joinGame(msg.gameId, msg.playerId);
        emitter.emit('gameJoined', {
            gameId: game.id,
            ownerId: game.ownerId,
            players: Object.keys(game.players),
            badSpecialRoles: game.badSpecialRoles,
            goodSpecialRoles: game.goodSpecialRoles
        });
    });
};

exports.app = app;
exports.http = http;

exports.GameController = GameController;