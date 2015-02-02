/**
 * Created by frank on 1/31/15.
 */
var _ = require('underscore');
var Shuffle = require('shuffle');

var PLAYER_SETUP = require('../config/player_setup');
var GOOD_ROLES = PLAYER_SETUP.GOOD_ROLES;
var BAD_ROLES = PLAYER_SETUP.BAD_ROLES;
var VIEW = PLAYER_SETUP.VIEW;


var STAGES = {
    NOT_STARTED: 0,
    SELECT_QUESTERS: 1,
    VOTE_ON_QUESTERS: 2,
    QUEST: 3,
    KILL_MERLIN: 4,
    DONE: 5
};

function Game(gameId, ownerId, options) {
    this.options = options || {};
    this.id = gameId;
    this.ownerId = ownerId;
    this.missionIndex = 0;
    this.numSuccesses = 0;
    this.numFails = 0;
    this.numRejections = 0;
    this.stage = STAGES.NOT_STARTED;
    this.king = null;
    this.goodSpecialRoles = this.options.goodSpecialRoles || {};
    this.badSpecialRoles = this.options.badSpecialRoles || {};
    this.roles = {};
    this.players = {};
    this.playerOrder = [];
    this.kingMarker = 0;
}


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

Game.prototype._makeRoleDeck = function () {
    var numVillageIdiots = PLAYER_SETUP[this.getNumPlayers()]['good'] - this.goodSpecialRoles.length,
        numRegularBadPlayers = PLAYER_SETUP[this.getNumPlayers()]['bad'] - this.badSpecialRoles.length,
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


Game.prototype._createView = function (role) {
    var view = [],
        rolesToPlayers = _.invert(this.roles);

    _.each(VIEW[role], function (visibleRole) {
        if (rolesToPlayers.hasOwnProperty(visibleRole)) {
            view.push(rolesToPlayers[visibleRole]);
        }
    });
    return view;
};

Game.prototype.addPlayer = function (player) {
    if (this.stage != STAGES.NOT_STARTED) {
        throw new Error('cannot add a player after the game has started');
    }
    if (!player || !player.id) {
        throw new Error('malformed player: ', JSON.stringify(player));
    }
    if (this.getNumPlayers() >= PLAYER_SETUP.maxNumberOfPlayers) {
        throw new Error('cannot add more players than ' + PLAYER_SETUP.maxNumberOfPlayers);
    }
    this.players[player.id] = player;

};


Game.prototype.getNumPlayers = function () {
    var numPlayers = Object.keys(this.players).length;
    return numPlayers;
}
Game.prototype.start = function () {
    var self = this;
    if (this.getNumPlayers() < 5) {
        throw new Error('Not enough players have joined yet');
    }

    this._assignRoles();
    _.each(this.players, function (player, playerId) {
        var view = self._createView(self.roles[playerId]);
        player.updateView(view);
    });

    this.playerOrder = Shuffle.shuffle({deck: Object.keys(this.players)}).cards;
    this.king = this.playerOrder[this.kingMarker];
    this.stage = STAGES.SELECT_QUESTERS;
};


exports.STAGES = STAGES;
exports.Game = Game;
