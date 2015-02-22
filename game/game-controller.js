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

function GameController(emitter) {
    this.emitter = emitter;
    this.sessions = {};
    this.games = {};
    this.players = {};
}

GameController.prototype.createGame = function (gameId, playerId, options) {
    var game = new Game(gameId, playerId, options);
    this.games[gameId] = game;
    game.addPlayer(this.players[playerId]);
    return game;
};

GameController.prototype.joinGame = function (gameId, playerId) {
    var game = this.games[gameId];
    game.addPlayer(this.players[playerId]);
    return game;
};


GameController.prototype._handleRegisterPlayer = function (msg) {
    var playerId = msg.playerId;
    this.players[playerId] = new Player(playerId);
    this.emitter.emit('playerRegistered', {playerId: playerId});
};

GameController.prototype._handleCreateGame = function (msg) {
    var game = this.createGame(msg.gameId, msg.playerId, msg.gameOptions);
    this.emitter.emit('gameCreated', {
        gameId: game.id,
        ownerId: game.ownerId,
        badSpecialRoles: game.badSpecialRoles,
        goodSpecialRoles: game.goodSpecialRoles,
        gameFromController: this.games[game.id]
    });
};


GameController.prototype._handleJoinGame = function (msg) {
    var game = this.joinGame(msg.gameId, msg.playerId);
    this.emitter.emit('gameJoined', {
        gameId: game.id,
        ownerId: game.ownerId,
        joinedPlayerId: msg.playerId,
        players: Object.keys(game.players),
        badSpecialRoles: game.badSpecialRoles,
        goodSpecialRoles: game.goodSpecialRoles
    });

};

GameController.prototype.init = function () {
    var self = this;
    this.emitter.on('registerPlayer', self._handleRegisterPlayer.bind(self));
    this.emitter.on('createGame', self._handleCreateGame.bind(self));
    this.emitter.on('joinGame', self._handleJoinGame.bind(self));
};

exports.app = app;
exports.http = http;

exports.GameController = GameController;