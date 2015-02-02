/**
 * Created by frank on 2/1/15.
 */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('underscore');

var engine = require('../game/engine');
var Player = require('../game/player');
var Game = engine.Game;

function SessionController() {
    this.sessions = {};
    this.games = {};
}

function Session(sessionSocket) {
    this.id = sessionSocket.id;
    this.socket = sessionSocket;
    this.game = null;
};

SessionController.prototype.createGame = function(gameId, player, options) {
    var game = new Game(gameId, options);
    this.games[gameId] = game;
    game.addPlayer(player);

    return game;
};

SessionController.prototype.joinGame = function(gameId, player) {
    var game = this.games[gameId];

    try {
        game.addPlayer(player);
    } catch (err) {
        throw new Error('');
    }

    return game;
};

SessionController.prototype.init = function () {
    io.on('connection', function (sessionSocket) {
        var session = new Session(sessionSocket),
            self = this;

        this.sessions[sessionSocket.id] = session;
        console.log('a user connected: session.id: ' + sessionSocket.id + ' rest of socket: ' + JSON.stringify(sessionSocket));

        sessionSocket.on('createGame', function (msg) {
            console.log('creating game: ' + msg);
            var player = new Player(msg.playerId),
                game = self.createGame(msg.gameId, player, msg.options);

            session.game = game;
            io.emit('gameCreated', msg);
        });

        sessionSocket.on('joinGame', function (msg) {
            console.log('joining game: ' + msg);
            var player = new Player(msg.playerId),
                game = self.joinGame([msg.gameId], player);

            session.game = game;
            io.emit('gameCreated', msg);
        });

        sessionSocket.on('disconnect', function () {
            console.log('user disconnected');
            delete this.sessionMap[sessionSocket.id];
        });

    });

};

