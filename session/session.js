function Session(sessionSocket) {
    this.id = sessionSocket.id;
    this.socket = sessionSocket;
    this.playerId = null;
}

function SessionController(emitter, io) {
    this.emitter = emitter;
    this.io = io;
    this.sessions = {}; //sessionSocketId -> session;
}

SessionController.prototype.exec = function (apiCall, callback) {
    try {
        return apiCall() || true;
    } catch (e) {
        if (callback) callback(e);
        this.emitter.emit('error', e);
        return false;
    }
};

SessionController.prototype._validateRegistered = function (sessionSocketId) {
    if (this.sessions[sessionSocketId].playerId === null) {
        throw new Error('session ' + sessionSocketId + ' is not registered');
    }
};

SessionController.prototype._registerPlayer = function (sessionSocketId, playerId) {
    var session = this.sessions[sessionSocketId];
    this.emitter.emit('registerPlayer', {
        playerId: playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('registerPlayerFailed', error);
                return;
            }
            session.playerId = playerId;
            session.socket.emit('playerRegistered', {playerId: msg.playerId, sessionId: sessionSocketId});
        }
    });

};

SessionController.prototype._handleRegisterPlayer = function (sessionSocketId, msg) {
    var playerId = msg.playerId;
    this.exec(this._registerPlayer.bind(this, sessionSocketId, playerId));
};

SessionController.prototype._createGame = function (sessionSocketId, gameId, gameOptions) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('createGame', {
        gameId: gameId,
        playerId: session.playerId,
        badSpecialRoles: gameOptions.badSpecialRoles,
        goodSpecialRoles: gameOptions.goodSpecialRoles,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('createGameFailed', error);
                return;
            }
            session.socket.emit('gameCreated', {
                gameId: msg.gameId,
                badSpecialRoles: msg.badSpecialRoles,
                goodSpecialRoles: msg.goodSpecialRoles
            });
        }
    });

};

SessionController.prototype._handleCreateGame = function (sessionSocketId, msg) {
    this.exec(this._createGame.bind(this, sessionSocketId, msg.gameId, msg.gameOptions));
};

SessionController.prototype._joinGame = function (sessionSocketId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('joinGame', {
        gameId: gameId,
        playerId: session.playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('joinGameFailed', error);
                return;
            }
            session.socket.emit('gameJoined', {
                gameId: msg.gameId,
                badSpecialRoles: msg.badSpecialRoles,
                goodSpecialRoles: msg.goodSpecialRoles,
                ownerId: msg.ownerId,
                joinedPlayerId: msg.joinedPlayerId,
                players: msg.players,
                sessionId: sessionSocketId
            });
        }
    });
};

SessionController.prototype._handleJoinGame = function (sessionSocketId, msg) {
    this.exec(this._joinGame.bind(this, sessionSocketId, msg.gameId));
};

SessionController.prototype._startGame = function (sessionSocketId, gameId) {
    var session = this.sessions[sessionSocketId];
    this.emitter.emit('startGame', {
        gameId: gameId,
        playerId: session.playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('startGameFailed', error);
                return;
            }
            session.socket.emit('gameStarted', {
                gameId: msg.gameId,
                players: msg.players,
                badSpecialRoles: msg.badSpecialRoles,
                goodSpecialRoles: msg.goodSpecialRoles,
                sessionId: sessionSocketId
            });
        }
    });
};

SessionController.prototype._handleStartGame = function (sessionSocketId, msg) {
    var playerId = msg.playerId,
        gameId = msg.gameId;
    this.exec(this._startGame(this, sessionSocketId, playerId, gameId));
};


SessionController.prototype._registerSession = function (sessionSocket) {
    this.sessions[sessionSocket.id] = new Session(sessionSocket);
    sessionSocket.emit('hi', sessionSocket.id);
    console.log('a user connected: session.id: ' + sessionSocket.id + ' rest of socket: ' + sessionSocket.toString());

    sessionSocket.on('registerPlayer', this._handleRegisterPlayer.bind(this, sessionSocket.id));
    sessionSocket.on('createGame', this._handleCreateGame.bind(this, sessionSocket.id));
    sessionSocket.on('joinGame', this._handleJoinGame.bind(this, sessionSocket.id));
    sessionSocket.on('startGame', this._handleStartGame.bind(this, sessionSocket.id));
    //sessionSocket.on('selectQuester', this._handleSelectQuester.bind(this, sessionSocket.id));
    //sessionSocket.on('removeQuester', this._handleRemoveQuester.bind(this, sessionSocket.id));
    //sessionSocket.on('submitQuesters', this._handleSubmitQuestersForVoting.bind(this, sessionSocket.id));
    //sessionSocket.on('voteAcceptReject', this._handleVoteAcceptReject.bind(this, sessionSocket.id));
    //sessionSocket.on('voteSuccessFail', this._handleVoteSuccessFail.bind(this, sessionSocket.id));

};

SessionController.prototype.init = function () {
    var self = this;
    this.io.on('connection', this._registerSession.bind(this));

};

exports.SessionController = SessionController;
