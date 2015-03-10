var _ = require('underscore');

function Session(sessionSocket) {
    this.id = sessionSocket.id;
    this.socket = sessionSocket;
    this.playerId = null;
}

function SessionController(emitter, io) {
    this.emitter = emitter;
    this.io = io;
    this.sessions = {}; //sessionSocketId -> session;
    this.playersToSessions = {}; //playerId --> session
}

SessionController.prototype.sessionByPlayerId = function (playerId) {
    return this.playersToSessions[playerId];
};

SessionController.prototype.exec = function (apiCall) {
    try {
        return apiCall() || true;
    } catch (e) {
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
    var session = this.sessions[sessionSocketId],
        self = this;
    if (session.playerId !== null) {
        var error = new Error('session already has a playerId ' + session.playerId);

        session.socket.emit('registerPlayerNack', error.message);
        throw error;
    }
    this.emitter.emit('registerPlayer', {
        playerId: playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('registerPlayerNack', error.message);
                return;
            }
            session.playerId = playerId;
            self.playersToSessions[playerId] = session;
            session.socket.emit('registerPlayerAck', {playerId: msg.playerId, sessionId: sessionSocketId});
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
        gameOptions: gameOptions,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('createGameNack', error.message);
                return;
            }
            session.socket.emit('createGameAck', {
                gameId: msg.gameId,
                gameOptions: msg.gameOptions,
                sessionId: sessionSocketId
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
                session.socket.emit('joinGameNack', error.message);
                return;
            }
            session.socket.emit('joinGameAck', {
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
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('startGame', {
        gameId: gameId,
        playerId: session.playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('startGameNack', error.message);
                return;
            }
            session.socket.emit('startGameAck', {
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
    var gameId = msg.gameId;
    this.exec(this._startGame.bind(this, sessionSocketId, gameId));
};

SessionController.prototype._selectQuester = function (sessionSocketId, playerId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('selectQuester', {
        gameId: gameId,
        requestingPlayerId: session.playerId,
        playerId: playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('selectQuesterNack', error.message);
                return;
            }
            session.socket.emit('selectQuesterAck', {
                gameId: msg.gameId,
                requestingPlayerId: msg.requestingPlayerId,
                selectedQuesterId: msg.playerId,
                sessionId: sessionSocketId
            });
        }
    });
};

SessionController.prototype._handleSelectQuester = function (sessionSocketId, msg) {
    this.exec(this._selectQuester.bind(this, sessionSocketId, msg.playerId, msg.gameId));
};

SessionController.prototype._removeQuester = function (sessionSocketId, playerId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('removeQuester', {
        gameId: gameId,
        requestingPlayerId: session.playerId,
        playerId: playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('removeQuesterNack', error.message);
                return;
            }
            session.socket.emit('removeQuesterAck', {
                gameId: msg.gameId,
                removedQuesterId: msg.playerId,
                requestingPlayerId: msg.requestingPlayerId,
                sessionId: sessionSocketId
            });

        }

    });
};

SessionController.prototype._handleRemoveQuester = function (sessionSocketId, msg) {
    this.exec(this._removeQuester.bind(this, sessionSocketId, msg.playerId, msg.gameId));
};

SessionController.prototype._submitQuesters = function (sessionSocketId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('submitQuesters', {
        gameId: gameId,
        requestingPlayerId: session.playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('submitQuestersNack', error.message);
                return;
            }
            session.socket.emit('submitQuestersAck', {
                gameId: msg.gameId,
                selectedQuesters: msg.selectedQuesters,
                sessionId: sessionSocketId
            });

        }

    });
};

SessionController.prototype._handleSubmitQuesters = function (sessionSocketId, msg) {
    this.exec(this._submitQuesters.bind(this, sessionSocketId, msg.gameId));
};


SessionController.prototype._voteAcceptReject = function (sessionSocketId, vote, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('voteAcceptReject', {
        gameId: gameId,
        playerId: session.playerId,
        vote: vote,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('voteAcceptRejectNack', error.message);
                return;
            }

            session.socket.emit('voteAcceptRejectAck', {
                gameId: msg.gameId,
                playerId: msg.playerId,
                vote: msg.vote,
                sessionId: sessionSocketId
            });

        }

    });
};

SessionController.prototype._handleVoteAcceptReject = function (sessionSocketId, msg) {
    this.exec(this._voteAcceptReject.bind(this, sessionSocketId, msg.vote, msg.gameId));
};

SessionController.prototype._voteSuccessFail = function (sessionSocketId, vote, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('voteSuccessFail', {
        gameId: gameId,
        playerId: session.playerId,
        vote: vote,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('voteSuccessFailNack', error.message);
                return;
            }
            session.socket.emit('voteSuccessFailAck', {
                gameId: msg.gameId,
                playerId: msg.playerId,
                vote: msg.vote,
                sessionId: sessionSocketId
            });

        }

    });
};

SessionController.prototype._handleVoteSuccessFail = function (sessionSocketId, msg) {
    this.exec(this._voteSuccessFail.bind(this, sessionSocketId, msg.vote, msg.gameId));
};

SessionController.prototype._targetMerlin = function (sessionSocketId, targetId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('targetMerlin', {
        gameId: gameId,
        requestingPlayerId: session.playerId,
        targetId: targetId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('targetMerlinNack', error.message);
                return;
            }
            session.socket.emit('targetMerlinAck', {
                gameId: msg.gameId,
                requestingPlayerId: msg.requestingPlayerId,
                targetId: msg.targetId,
                sessionId: sessionSocketId
            });

        }

    });
};


SessionController.prototype._handleTargetMerlin = function (sessionSocketId, msg) {
    this.exec(this._targetMerlin.bind(this, sessionSocketId, msg.targetId, msg.gameId));
};


SessionController.prototype._attemptKillMerlin = function (sessionSocketId, gameId) {
    var session = this.sessions[sessionSocketId];
    this._validateRegistered(sessionSocketId);
    this.emitter.emit('killMerlin', {
        gameId: gameId,
        requestingPlayerId: session.playerId,
        callback: function (error, msg) {
            if (error) {
                session.socket.emit('killMerlinAttemptNack', error.message);
                return;
            }
            session.socket.emit('killMerlinAttemptAck', {
                gameId: msg.gameId,
                requestingPlayerId: msg.requestingPlayerId,
                stage: msg.stage,
                sessionId: sessionSocketId
            });

        }

    });
};

SessionController.prototype._handleAttemptKillMerlin = function (sessionSocketId, msg) {
    this.exec(this._attemptKillMerlin.bind(this, sessionSocketId, msg.gameId));
};

SessionController.prototype._registerSession = function (sessionSocket) {
    var sessionSocketId = sessionSocket.id;
    this.sessions[sessionSocketId] = new Session(sessionSocket);
    sessionSocket.emit('hi', sessionSocketId);

    sessionSocket.on('registerPlayer', this._handleRegisterPlayer.bind(this, sessionSocketId));
    sessionSocket.on('createGame', this._handleCreateGame.bind(this, sessionSocketId));
    sessionSocket.on('joinGame', this._handleJoinGame.bind(this, sessionSocketId));
    sessionSocket.on('startGame', this._handleStartGame.bind(this, sessionSocketId));
    sessionSocket.on('selectQuester', this._handleSelectQuester.bind(this, sessionSocketId));
    sessionSocket.on('removeQuester', this._handleRemoveQuester.bind(this, sessionSocketId));
    sessionSocket.on('submitQuesters', this._handleSubmitQuesters.bind(this, sessionSocketId));
    sessionSocket.on('voteAcceptReject', this._handleVoteAcceptReject.bind(this, sessionSocketId));
    sessionSocket.on('voteSuccessFail', this._handleVoteSuccessFail.bind(this, sessionSocketId));
    sessionSocket.on('targetMerlin', this._handleTargetMerlin.bind(this, sessionSocketId));
    sessionSocket.on('killMerlin', this._handleAttemptKillMerlin.bind(this, sessionSocketId));


};

SessionController.prototype._gameStarted = function (gameId, players, badSpecialRoles, goodSpecialRoles) {
    var self = this;
    _.each(players, function (player, playerId) {
        var session = self.sessionByPlayerId(playerId),
            gameStartedMsg = {
                playerId: playerId,
                role: player.role,
                view: player.view,
                badSpecialRoles: badSpecialRoles,
                goodSpecialRoles: goodSpecialRoles
            };
        session.socket.emit('gameStarted', gameStartedMsg);
    });
};

SessionController.prototype._handleGameStarted = function (msg) {
    var gameId = msg.gameId,
        players = msg.players,
        badSpecialRoles = msg.badSpecialRoles,
        goodSpecialRoles = msg.goodSpecialRoles;
    this.exec(this._gameStarted.bind(this, gameId, players, badSpecialRoles, goodSpecialRoles));
};

SessionController.prototype._handleVotedOnQuesters = function (msg) {
    var gameId = msg.gameId,
        playerId = msg.playerId;
    this.io.emit('votedOnQuesters', {gameId: gameId, playerId: playerId});
};

SessionController.prototype._handleVotedOnSuccessFail = function (msg) {
    var gameId = msg.gameId,
        playerId = msg.playerId;
    this.io.emit('votedOnSuccessFail', {gameId: gameId, playerId: playerId});
};

SessionController.prototype._handleQuestEnded = function (msg) {
    var response = {
        gameId: msg.gameId,
        votes: _.values(msg.votes),
        questResult: msg.voteResult,
        questIndex: msg.questIndex,
        nextQuest: msg.nextQuest
    };
    this.io.emit('questEnded', response);
};

SessionController.prototype._passEventToClient = function (event) {
    var self = this;
    this.emitter.on(event, function (msg) {
        self.io.emit(event, msg);
    });
};

SessionController.prototype.init = function () {
    this.io.on('connection', this._registerSession.bind(this));
    this._passEventToClient('playerRegistered');
    this._passEventToClient('gameCreated');
    this._passEventToClient('gameJoined');
    this.emitter.on('gameStarted', this._handleGameStarted.bind(this));
    this._passEventToClient('questerSelected');
    this._passEventToClient('questerRemoved');
    this._passEventToClient('questersSubmitted');
    this.emitter.on('votedOnQuesters', this._handleVotedOnQuesters.bind(this));
    this._passEventToClient('questAccepted');
    this._passEventToClient('questRejected');
    this.emitter.on('votedOnSuccessFail', this._handleVotedOnSuccessFail.bind(this));
    this.emitter.on('questEnded', this._handleQuestEnded.bind(this));
    this._passEventToClient('killMerlinStage');
    this._passEventToClient('merlinTargeted');
    this._passEventToClient('killMerlinAttempted');
};

exports.SessionController = SessionController;
