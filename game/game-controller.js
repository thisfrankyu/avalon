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
var STAGES = engine.STAGES;
var QUEST_STATE = require('./quest').QUEST_STATE;

function GameController(emitter) {
    this.emitter = emitter;
    this.players = {}; //playerId --> player
    this.games = {}; //gameId --> game
}

GameController.prototype.exec = function (apiCall, callback) {
    try {
        return apiCall() || true;
    } catch (e) {
        if (callback) callback(e);
        this.emitter.emit('error', e);
        return false;
    }
};

GameController.prototype._validateGame = function (gameId) {
    if (!this.games.hasOwnProperty(gameId)) {
        throw new Error('Game with gameId ' + gameId + ' not found');
    }
};

GameController.prototype._registerPlayer = function (playerId, callback) {
    if (_.has(this.players, playerId)) {
        throw new Error('playerId ' + playerId + ' has already been registered');
    }
    this.players[playerId] = new Player(playerId);
    if (callback) callback(null, {playerId: playerId});
}

GameController.prototype._handleRegisterPlayer = function (msg) {
    var playerId = msg.playerId,
        callback = msg.callback;
    if (!this.exec(this._registerPlayer.bind(this, playerId, callback), callback)) return;
    this.emitter.emit('playerRegistered', {playerId: playerId});
};

GameController.prototype._createGame = function (gameId, playerId, options) {
    if (_.has(this.games, gameId)) {
        throw new Error(gameId + ' has already been created');
    }
    var game = new Game(gameId, playerId, options);
    this.games[gameId] = game;
    game.addPlayer(this.players[playerId]);
    return game;
};


GameController.prototype._handleCreateGame = function (msg) {
    var game = this.exec(this._createGame.bind(this, msg.gameId, msg.playerId, msg.gameOptions), msg.callback);
    if (!game) return;
    var gameCreatedMsg = {
        gameId: game.id,
        ownerId: game.ownerId,
        gameOptions: {
            badSpecialRoles: game.badSpecialRoles,
            goodSpecialRoles: game.goodSpecialRoles
        },
        gameFromController: this.games[game.id]
    };
    if (msg.callback) msg.callback(null, gameCreatedMsg);
    this.emitter.emit('gameCreated', gameCreatedMsg);
};

GameController.prototype._joinGame = function (gameId, playerId) {
    var game = this.games[gameId];
    this._validateGame(gameId);
    game.addPlayer(this.players[playerId]);
    return game;
};

GameController.prototype._handleJoinGame = function (msg) {
    var game = this.exec(this._joinGame.bind(this, msg.gameId, msg.playerId), msg.callback);
    if (!game) return;
    var gameJoinedMsg = {
        gameId: game.id,
        ownerId: game.ownerId,
        joinedPlayerId: msg.playerId,
        players: game.players,
        gameOptions: {
            badSpecialRoles: game.badSpecialRoles,
            goodSpecialRoles: game.goodSpecialRoles
        }
    };
    if (msg.callback) msg.callback(null, gameJoinedMsg);
    this.emitter.emit('gameJoined', gameJoinedMsg);
};

GameController.prototype._startGame = function (gameId, playerId) {
    var game = this.games[gameId];
    this._validateGame(gameId);

    if (playerId !== game.ownerId) {
        throw new Error('Only the owner may start the game');
    }

    game.start();
    return game;
};

GameController.prototype._handleStartGame = function (msg) {
    var playerId = msg.playerId,
        gameId = msg.gameId;

    var game = this.exec(this._startGame.bind(this, gameId, playerId), msg.callback);
    if (!game) return;

    var gameStartedMsg = {
        gameId: gameId,
        players: game.players,
        playerOrder: game.playerOrder,
        kingIndex: game.kingIndex,
        quests: game.quests,
        gameOptions: {
            badSpecialRoles: game.badSpecialRoles,
            goodSpecialRoles: game.goodSpecialRoles
        }
    };
    if (msg.callback) msg.callback(null, gameStartedMsg);
    this.emitter.emit('gameStarted', gameStartedMsg);
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
    if (!this.exec(this._selectQuester.bind(this, playerId, requestingPlayerId, gameId), msg.callback)) return;
    var questerSelectedMsg = {
        gameId: gameId,
        selectedQuesterId: playerId,
        requestingPlayerId: requestingPlayerId
    };
    if (msg.callback) msg.callback(null, questerSelectedMsg);
    this.emitter.emit('questerSelected', questerSelectedMsg);
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
    if (!this.exec(this._removeQuester.bind(this, playerId, requestingPlayerId, gameId), msg.callback)) return;

    var questerRemovedMsg = {
        gameId: gameId,
        removedQuesterId: playerId,
        requestingPlayerId: requestingPlayerId
    };
    if (msg.callback) msg.callback(null, questerRemovedMsg);
    this.emitter.emit('questerRemoved', questerRemovedMsg);
};

GameController.prototype._submitQuesters = function (playerId, gameId, callback) {
    var game = this.games[gameId];
    this._validateGame(gameId);
    game.submitQuestersForVoting(playerId);
    var questersSubmittedMsg = {
        gameId: gameId,
        selectedQuesters: game.currentQuest().selectedQuesters
    };
    if (callback) callback(questersSubmittedMsg);
    this.emitter.emit('questersSubmitted', questersSubmittedMsg);
};

GameController.prototype._handleSubmitQuesters = function (msg) {
    var gameId = msg.gameId,
        requestingPlayerId = msg.requestingPlayerId,
        callback = msg.callback;
    this.exec(this._submitQuesters.bind(this, requestingPlayerId, gameId, callback), callback);
};

GameController.prototype._voteAcceptReject = function (playerId, vote, gameId, callback) {
    var game = this.games[gameId],
        result;
    this._validateGame(gameId);
    result = game.voteAcceptReject(playerId, vote);

    var votedOnQuestersMsg = {
        gameId: gameId,
        playerId: playerId,
        vote: vote
    };
    this.emitter.emit('votedOnQuesters', votedOnQuestersMsg);
    if (callback) callback(null, votedOnQuestersMsg);

    if (result.stage === STAGES.QUEST) {
        this.emitter.emit('questAccepted', {
            gameId: gameId,
            players: game.currentQuest().selectedQuesters,
            votes: result.votes
        });
    }
    if (result.stage === STAGES.SELECT_QUESTERS) {
        this.emitter.emit('questRejected', {
            gameId: gameId,
            players: game.currentQuest().selectedQuesters,
            numRejections: game.currentQuest().numRejections,
            votes: result.votes
        });
    }
    // TODO: what to do when game ends
};

GameController.prototype._handleVoteAcceptReject = function (msg) {
    var playerId = msg.playerId,
        vote = msg.vote,
        gameId = msg.gameId,
        callback = msg.callback;
    this.exec(this._voteAcceptReject.bind(this, playerId, vote, gameId, callback), callback);
};

GameController.prototype._voteSuccessFail = function (playerId, vote, gameId, callback) {
    var game = this.games[gameId],
        result;
    this._validateGame(gameId);
    result = game.voteSuccessFail(playerId, vote);
    var votedOnSuccessFailMsg = {
        gameId: gameId,
        playerId: playerId,
        vote: vote
    };
    if (callback) callback(null, votedOnSuccessFailMsg);
    this.emitter.emit('votedOnSuccessFail', votedOnSuccessFailMsg);
    if (result.voteResult !== QUEST_STATE.UNDECIDED) {
        if (result.stage === STAGES.KILL_MERLIN) {
            this.emitter.emit('killMerlinStage', {
                gameId: gameId,
                stage: result.stage
            });
        }
        this.emitter.emit('questEnded', {
            gameId: gameId,
            votes: result.votes,
            questResult: result.voteResult,
            questIndex: result.questIndex,
            nextQuest: game.currentQuest(),
            stage: result.stage
        });
    }
};

GameController.prototype._handleVoteSuccessFail = function (msg) {
    var playerId = msg.playerId,
        vote = msg.vote,
        gameId = msg.gameId,
        callback = msg.callback;

    this.exec(this._voteSuccessFail.bind(this, playerId, vote, gameId, callback), callback);
};

GameController.prototype._targetMerlin = function (targetId, requestingPlayerId, gameId, callback) {
    var game = this.games[gameId],
        msg;
    this._validateGame(gameId);
    game.targetMerlin(targetId, requestingPlayerId);
    msg = {
        targetId: targetId,
        requestingPlayerId: requestingPlayerId,
        gameId: gameId
    };
    if (callback) callback(null, msg);
    this.emitter.emit('merlinTargeted', msg);
};

GameController.prototype._handleTargetMerlin = function (msg) {
    var targetId = msg.targetId,
        requestingPlayerId = msg.requestingPlayerId,
        gameId = msg.gameId,
        callback = msg.callback;

    this.exec(this._targetMerlin.bind(this, targetId, requestingPlayerId, gameId, callback), callback);
};

GameController.prototype._attemptKillMerlin = function (requestingPlayerId, gameId, callback) {
    var game = this.games[gameId], msg;
    this._validateGame(gameId);
    game.killTargetMerlin(requestingPlayerId);
    msg = {
        requestingPlayerId: requestingPlayerId,
        gameId: gameId,
        stage: game.stage
    };
    if (callback) callback(null, msg);
    this.emitter.emit('killMerlinAttempted', msg);
};

GameController.prototype._handleAttemptKillMerlin = function (msg) {
    var requestingPlayerId = msg.requestingPlayerId,
        gameId = msg.gameId,
        callback = msg.callback;

    this.exec(this._attemptKillMerlin.bind(this, requestingPlayerId, gameId, callback), callback);
};

GameController.prototype.init = function () {
    var self = this;
    this.emitter.on('registerPlayer', self._handleRegisterPlayer.bind(self));
    this.emitter.on('createGame', self._handleCreateGame.bind(self));
    this.emitter.on('joinGame', self._handleJoinGame.bind(self));
    this.emitter.on('startGame', self._handleStartGame.bind(self));
    this.emitter.on('selectQuester', self._handleSelectQuester.bind(self));
    this.emitter.on('removeQuester', self._handleRemoveQuester.bind(self));
    this.emitter.on('submitQuesters', self._handleSubmitQuesters.bind(self));
    this.emitter.on('voteAcceptReject', self._handleVoteAcceptReject.bind(self));
    this.emitter.on('voteSuccessFail', self._handleVoteSuccessFail.bind(self));
    this.emitter.on('targetMerlin', self._handleTargetMerlin.bind(self));
    this.emitter.on('killMerlin', self._handleAttemptKillMerlin.bind(self));
};

exports.app = app;
exports.http = http;

exports.GameController = GameController;
