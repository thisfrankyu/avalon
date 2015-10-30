var _ = require('underscore');
var Shuffle = require('shuffle');

var QUEST = require('./quest');
var Quest = QUEST.Quest;
var QUEST_STATE = QUEST.QUEST_STATE;
var VOTE = QUEST.VOTE;
var RULES = require('./rules');
var PLAYERS = RULES.PLAYERS;
var GOOD_ROLES = RULES.GOOD_ROLES;
var BAD_ROLES = RULES.BAD_ROLES;
var VIEW = RULES.VIEW;


var STAGES = {
    NOT_STARTED: 'NOT_STARTED',
    SELECT_QUESTERS: 'SELECT_QUESTERS',
    VOTE_ON_QUESTERS: 'VOTE_ON_QUESTERS',
    QUEST: 'QUEST',
    KILL_MERLIN: 'KILL_MERLIN',
    GOOD_WINS: 'GOOD_WINS',
    BAD_WINS: 'BAD_WINS',
    DONE: 'DONE'
};
var ALIGNMENT = {
    GOOD: 'GOOD',
    BAD: 'BAD'
};

function Game(gameId, ownerId, options) {
    this.options = options || {};
    this.id = gameId;
    this.ownerId = ownerId;

    this.stage = STAGES.NOT_STARTED;

    this.numSuccesses = 0;
    this.numFails = 0;
    this.numRejections = 0;

    this.questIndex = 0;
    this.quests = []; //quest
    this.currentSuccessFailVotes = {}; //playerId --> vote

    this.players = {}; //playerId --> players
    this.roles = {}; //playerId --> role
    //TODO: be able to change the special roles we're playing with at any time before start
    this.goodSpecialRoles = this.options.goodSpecialRoles || [];
    this.badSpecialRoles = this.options.badSpecialRoles || [];

    this.kingIndex = 0;
    this.playerOrder = [];

    this.targetedMerlin = null;
}

//Accessors
Game.prototype.currentKing = function () {
    return this.playerOrder[this.kingIndex];
};

Game.prototype.currentQuest = function () {
    return this.quests[this.questIndex];
};

Game.prototype.getNumPlayers = function () {
    return Object.keys(this.players).length;
};

//Pre-Game
Game.prototype.addPlayer = function (player) {
    if (this.stage != STAGES.NOT_STARTED) {
        throw new Error('cannot add a player after the game has started');
    }
    if (!player || !player.id) {
        throw new Error('malformed player: ', JSON.stringify(player));
    }
    //TODO don't allow same player to be added twice
    this.players[player.id] = player;

};

Game.prototype.setGoodSpecialRoles = function (roles) {
    this.goodSpecialRoles = roles;
};
Game.prototype.setBadSpecialRoles = function (roles) {
    this.badSpecialRoles = roles;
};
Game.prototype.getAlignment = function (playerId) {
    this._validatePlayerInGame(playerId);
    return GOOD_ROLES.hasOwnProperty(this.roles[playerId]) ? ALIGNMENT.GOOD : ALIGNMENT.BAD;
};

//Start
Game.prototype.start = function () {
    if (this.stage !== STAGES.NOT_STARTED) {
        throw new Error('tried to start game after game started');
    }

    var self = this;
    if (!RULES.PLAYERS.hasOwnProperty(this.getNumPlayers())) {
        throw new Error('Invalid number of players: ' + this.getNumPlayers());
    }

    this._assignRoles();
    _.each(this.players, function (player, playerId) {
        var view = self._createView(self.roles[playerId]);
        player.updateView(view);
    });

    this._createQuests();

    this.playerOrder = Shuffle.shuffle({deck: Object.keys(this.players)}).cards;
    this.stage = STAGES.SELECT_QUESTERS;
};

//Set up Roles
Game.prototype._assignRoles = function () {
    var roleDeck = this._makeRoleDeck(),
        roleDeckIndex = 0,
        self = this;
    _.each(this.players, function (player) {
        var role = roleDeck.cards[roleDeckIndex];
        self.roles[player.id] = role;
        roleDeckIndex++;
        player.setRole(role);
    });
};

Game.prototype._makeRoleDeck = function () {
    var numVillageIdiots = PLAYERS[this.getNumPlayers()].numGood - this.goodSpecialRoles.length,
        numRegularBadPlayers = PLAYERS[this.getNumPlayers()].numBad - this.badSpecialRoles.length,
        roleCardsPreShuffled = [],
        deck;

    this._validateRoles(numVillageIdiots, numRegularBadPlayers);

    roleCardsPreShuffled = this.goodSpecialRoles.concat(this.badSpecialRoles);

    _.times(numVillageIdiots, function () {
        roleCardsPreShuffled.push(GOOD_ROLES.VILLAGE_IDIOT);
    });

    _.times(numRegularBadPlayers, function () {
        roleCardsPreShuffled.push(BAD_ROLES.REGULAR_MINION);
    });

    deck = Shuffle.shuffle({deck: roleCardsPreShuffled});
    return deck;
};

Game.prototype._validateRoles = function (numVillageIdiots, numRegularBadPlayers) {
    if (numVillageIdiots < 0) {
        throw new Error('chose too many good special roles');
    }
    if (numRegularBadPlayers < 0) {
        throw new Error('chose too many bad special roles');
    }

    if (_.uniq(this.goodSpecialRoles).length !== this.goodSpecialRoles.length) {
        throw new Error('Cannot provide duplicate special roles');
    }

    if (_.uniq(this.badSpecialRoles).length !== this.badSpecialRoles.length) {
        throw new Error('Cannot provide duplicate special roles');
    }

    this.goodSpecialRoles.forEach(function (role) {
        if (!GOOD_ROLES.hasOwnProperty(role) || !GOOD_ROLES[role]) {
            throw new Error(role + ' is not a special role');
        }
    });

    this.badSpecialRoles.forEach(function (role) {
        if (!BAD_ROLES.hasOwnProperty(role) || !BAD_ROLES[role]) {
            throw new Error(role + ' is not a special role');
        }
    });
};

Game.prototype._createView = function (role) {
    var view = [],
        self = this,
        rolesToPlayers = {};
    _.each(Object.keys(this.roles), function (playerId) {
        var role = self.roles[playerId];
        if (rolesToPlayers.hasOwnProperty(role)) {
            rolesToPlayers[role].push(playerId);
        } else {
            rolesToPlayers[role] = [playerId];
        }
    });
    _.each(VIEW[role], function (visibleRole) {
        if (rolesToPlayers.hasOwnProperty(visibleRole)) {
            view = view.concat(rolesToPlayers[visibleRole]);
        }
    });
    return view;
};

//Set up Quests
Game.prototype._createQuests = function () {
    if (this.stage != STAGES.NOT_STARTED) {
        throw new Error('cannot create quests after the game has started');
    }

    var self = this,
        questConfigs = PLAYERS[this.getNumPlayers()].quests;
    _.each(questConfigs, function (questConfig, index) {
        self.quests[index - 1] = new Quest(questConfig.numPlayers, questConfig.numToFail);
    });
};

//Select Questers
Game.prototype.selectQuester = function (playerId, requestingPlayerId) {
    this._validateSelectQuester(playerId, requestingPlayerId);
    this.currentQuest().selectQuester(playerId);

};

Game.prototype.removeQuester = function (playerId, requestingPlayerId) {
    this._validateSelectQuester(playerId, requestingPlayerId);
    this.currentQuest().removeQuester(playerId);
};

Game.prototype._validateSelectQuester = function (playerId, requestingPlayerId) {
    if (this.stage !== STAGES.SELECT_QUESTERS) {
        throw new Error('called selectQuester while not in ' + STAGES.SELECT_QUESTERS + ' stage');
    }
    this._validateCurrentKing(requestingPlayerId);
    this._validatePlayerInGame(playerId);
};

Game.prototype._validateCurrentKing = function (requestingPlayerId) {
    if (requestingPlayerId !== this.currentKing()) {
        throw new Error('Only the king may select players for a quest');
    }
};

Game.prototype._validatePlayerInGame = function (playerId) {
    if (!this.players.hasOwnProperty(playerId)) {
        throw new Error(playerId + ' is not in the game');
    }
};

Game.prototype.submitQuestersForVoting = function (requestingPlayerId) {
    this._validateCurrentKing(requestingPlayerId);
    if (!this.currentQuest().ready()) {
        throw new Error('Cannot submit questers until enough questers have been chosen');
    }
    this.stage = STAGES.VOTE_ON_QUESTERS;
    this.currentQuest().clearVotesOnQuest();
};


//Vote on Quest Phase

Game.prototype.voteAcceptReject = function (votingPlayerId, vote) {
    if (this.stage !== STAGES.VOTE_ON_QUESTERS) {
        throw new Error('Tried to vote on quest when not in vote stage');
    }

    this._validatePlayerInGame(votingPlayerId);
    this.currentQuest().votesOnQuest[votingPlayerId] = vote;
    var votes = _.clone(this.currentQuest().votesOnQuest);
    //this.currentVotesOnQuest[votingPlayerId] = vote;
    //var votes = _.clone(this.currentVotesOnQuest);
    //TODO: notify clients/controller that votingPlayerId has voted
    if (Object.keys(this.currentQuest().votesOnQuest).length ===
        Object.keys(this.players).length) {
        this._resolveVote();
    }
    return {stage: this.stage, votes: votes};
};

Game.prototype._resolveVote = function () {
    var votePassed = this.currentQuest().voteOnAcceptOrReject(_.values(this.currentQuest().votesOnQuest));
    this.kingIndex = (this.kingIndex + 1) % this.playerOrder.length;
    if (votePassed) {
        this._questAccepted();
        return;
    }
    this._questRejected();
};

Game.prototype._questRejected = function () {
    this.currentQuest().numRejections++;
    if (this.currentQuest().numRejections >= 5) {
        this.stage = STAGES.BAD_WINS;
        return;
    }
    this.currentQuest().clearSelectedQuesters();
    this.stage = STAGES.SELECT_QUESTERS;
};

Game.prototype._questAccepted = function () {
    this.stage = STAGES.QUEST;
};


//Questing Phase

Game.prototype.voteSuccessFail = function (votingPlayerId, vote) {
    if (this.stage !== STAGES.QUEST) {
        throw new Error('Tried to vote on success or fail before quest was started');
    }
    if (vote !== VOTE.SUCCESS && vote !== VOTE.FAIL) {
        throw new Error('invalid vote value');
    }
    this._validatePlayerOnQuest(votingPlayerId, vote);
    this.currentSuccessFailVotes[votingPlayerId] = vote;
    var successFailVotes = _.clone(this.currentSuccessFailVotes),
        voteResult = QUEST_STATE.UNDECIDED,
        questIndex = this.questIndex;
    //TODO: notify clients/controller that votingPlayerId has voted
    if (Object.keys(this.currentSuccessFailVotes).length ===
        this.currentQuest().selectedQuesters.length) {
        voteResult = this._resolveSuccessFailVote();
    }
    return {
        stage: this.stage,
        votes: successFailVotes,
        voteResult: voteResult,
        questIndex: questIndex
    };
};

Game.prototype._validatePlayerOnQuest = function (votingPlayerId, vote) {
    if (this.currentQuest().selectedQuesters.indexOf(votingPlayerId) === -1) {
        throw new Error('Player is not on quest!');
    }
    if (this.getAlignment(votingPlayerId) === ALIGNMENT.GOOD && vote === VOTE.FAIL) {
        throw new Error('Good players cannot vote fail on a quest');
    }
};

Game.prototype._resolveSuccessFailVote = function () {

    var votePassed = this.currentQuest().voteOnSuccessOrFail(_.values(this.currentSuccessFailVotes));
    this.currentSuccessFailVotes = {};
    if (votePassed) {
        this._questSucceeded();
    } else {
        this._questFailed();
    }
    this.questIndex++;
    return votePassed ? QUEST_STATE.SUCCEEDED : QUEST_STATE.FAILED;
};

Game.prototype._questFailed = function () {
    this.numFails++;

    this.currentQuest().result = QUEST_STATE.FAILED;
    if (this.numFails >= 3) {
        this.stage = STAGES.BAD_WINS;
    } else {
        this.stage = STAGES.SELECT_QUESTERS;
    }
};

Game.prototype._questSucceeded = function () {
    this.numSuccesses++;
    this.currentQuest().result = QUEST_STATE.SUCCEEDED;
    if (this.numSuccesses >= 3) {
        this.stage = STAGES.KILL_MERLIN;
    } else {
        this.stage = STAGES.SELECT_QUESTERS;
    }
};

//Kill Merlin phase
Game.prototype._validatePlayerIsBad = function (playerId) {
    if (this.getAlignment(playerId) !== ALIGNMENT.BAD) {
        throw new Error(playerId + ' is not bad');
    }
};

Game.prototype._validatePlayerIsGood = function (playerId) {
    if (this.getAlignment(playerId) !== ALIGNMENT.GOOD) {
        throw new Error(playerId + ' is not good');
    }
};

Game.prototype._validateKillMerlin = function (targetId, requestingPlayerId) {
    if (this.stage !== STAGES.KILL_MERLIN) {
        throw new Error('tried to target merlin before we got to the kill merlin stage');
    }
    this._validatePlayerInGame(requestingPlayerId);
    this._validatePlayerInGame(targetId);
    this._validatePlayerIsBad(requestingPlayerId);
    this._validatePlayerIsGood(targetId);
    if (_.values(this.roles).indexOf(BAD_ROLES.ASSASSIN) !== -1 && this.roles[requestingPlayerId] !== BAD_ROLES.ASSASSIN) {
        throw new Error('only the assassin can target a possible merlin if there is an assassin in game, requestingPlayerId: ' + requestingPlayerId)
    }
};
Game.prototype.targetMerlin = function (targetId, requestingPlayerId) {
    this._validateKillMerlin(targetId, requestingPlayerId);
    this.targetedMerlin = targetId;
};

Game.prototype.killTargetMerlin = function (requestingPlayerId) {
    if (this.targetedMerlin === null) {
        throw new Error('must target a merlin before killing');
    }
    this._validateKillMerlin(this.targetedMerlin, requestingPlayerId);
    this.stage = this.roles[this.targetedMerlin] === GOOD_ROLES.MERLIN ? STAGES.BAD_WINS : STAGES.GOOD_WINS;
};


exports.STAGES = STAGES;
exports.Game = Game;
