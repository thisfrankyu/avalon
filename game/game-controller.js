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

GameController.prototype.exec = function (apiCall) {
    try {
        return apiCall() || true;
    } catch (e) {
        this.emitter.emit('error', e);
        return false;
    }
};

GameController.prototype._validateGame = function (gameId) {
    if (!this.games.hasOwnProperty(gameId)) {
        throw new Error('Game with gameId ' + gameId + ' not found');
    }
};

GameController.prototype._handleRegisterPlayer = function (msg) {
    var playerId = msg.playerId;
    this.players[playerId] = new Player(playerId);
    this.emitter.emit('playerRegistered', {playerId: playerId});
};

GameController.prototype._createGame = function (gameId, playerId, options) {
    if (_.has(this.games, gameId)){
        throw new Error(gameId + ' has already been created');
    }
    var game = new Game(gameId, playerId, options);
    this.games[gameId] = game;
    game.addPlayer(this.players[playerId]);
    return game;
};


GameController.prototype._handleCreateGame = function (msg) {
    var game = this.exec(this._createGame.bind(this, msg.gameId, msg.playerId, msg.gameOptions));
    if (!game) return;
    this.emitter.emit('gameCreated', {
        gameId: game.id,
        ownerId: game.ownerId,
        badSpecialRoles: game.badSpecialRoles,
        goodSpecialRoles: game.goodSpecialRoles,
        gameFromController: this.games[game.id]
    });
};

GameController.prototype._joinGame = function (gameId, playerId) {
    var game = this.games[gameId];
    this._validateGame(gameId);
    game.addPlayer(this.players[playerId]);
    return game;
};

GameController.prototype._handleJoinGame = function (msg) {
    var game = this.exec(this._joinGame.bind(this, msg.gameId, msg.playerId));
    if (!game) return;
    this.emitter.emit('gameJoined', {
        gameId: game.id,
        ownerId: game.ownerId,
        joinedPlayerId: msg.playerId,
        players: Object.keys(game.players),
        badSpecialRoles: game.badSpecialRoles,
        goodSpecialRoles: game.goodSpecialRoles
    });
};

GameController.prototype._startGame = function (gameId, playerId) {
    var game = this.games[gameId];
    this._validateGame(gameId);

    if (playerId !== game.ownerId) {
        throw new Error('Only the owner may start the game');
    }

    game.start();
};

GameController.prototype._handleStartGame = function (msg) {
    var playerId = msg.playerId,
        gameId = msg.gameId;
    if (!this.exec(this._startGame.bind(this, gameId, playerId))) return;

    this.emitter.emit('gameStarted', {
        gameId: gameId
    });
};

GameController.prototype._selectQuester = function (playerId, requestingPlayerId, gameId) {
    var game = this.games[gameId];
    this._validateGame(gameId);
    game.selectQuester(playerId, requestingPlayerId);
};

GameController.prototype._handleSelectQuester = function (msg) {
    var playerId = msg.playerId,
        requestingPlayerId = msg.requestingPlayerId,
        gameId = msg.gameId;
    if (!this.exec(this._selectQuester.bind(this, playerId, requestingPlayerId, gameId))) return;


    this.emitter.emit('questerSelected', {
        gameId: gameId,
        selectedQuesterId: playerId,
        requestingPlayerId: requestingPlayerId
    });
};

GameController.prototype._removeQuester = function (playerId, requestingPlayerId, gameId) {
    var game = this.games[gameId];
    this._validateGame(gameId);
    game.removeQuester(playerId, requestingPlayerId);
};

GameController.prototype._handleRemoveQuester = function (msg) {
    var playerId = msg.playerId,
        requestingPlayerId = msg.requestingPlayerId,
        gameId = msg.gameId;
    if (!this.exec(this._removeQuester.bind(this, playerId, requestingPlayerId, gameId))) return;

    this.emitter.emit('questerRemoved', {
        gameId: gameId,
        removedQuesterId: playerId,
        requestingPlayerId: requestingPlayerId
    });
};


GameController.prototype.init = function () {
    var self = this;
    this.emitter.on('registerPlayer', self._handleRegisterPlayer.bind(self));
    this.emitter.on('createGame', self._handleCreateGame.bind(self));
    this.emitter.on('joinGame', self._handleJoinGame.bind(self));
    this.emitter.on('startGame', self._handleStartGame.bind(self));
    this.emitter.on('selectQuester', self._handleSelectQuester.bind(self));
    this.emitter.on('removeQuester', self._handleRemoveQuester.bind(self));
};

exports.app = app;
exports.http = http;

exports.GameController = GameController;