var _ = require('underscore');
var STAGES = require('./engine').STAGES;
var RULES = require('./rules');

/**
 * An object representing a game state, filtered to not include sensitive information.
 * @param {engine} game A game engine object.
 * @constructor
 */
function FilteredGameView(game) {
    this.id = game.id;
    this.ownerId = game.ownerId;
    this.stage = game.stage;
    this.numSuccesses = game.numSuccesses;
    this.numFails = game.numFails;
    this.numRejections = game.numRejections;
    this.questIndex = game.questIndex;
    this.quests = game.quests;
    this.currentVotesOnQuest = game.currentVotesOnQuest;
    this.currentSuccessFailVotes = _.keys(game.currentSuccessFailVotes);
    this.goodSpecialRoles = game.goodSpecialRoles;
    this.badSpecialRoles = game.badSpecialRoles;
    this.kingIndex = game.kingIndex;
    this.playerOrder = game.playerOrder;
    this.players = _.pluck(game.players, 'id');
    this.targetedMerlin = game.targetedMerlin;
    this.goodPlayerIds = game.stage === STAGES.KILL_MERLIN ? this._generateGoodPlayerIds(game) : null;
}

FilteredGameView.prototype._generateGoodPlayerIds = function (game) {
    return _.filter(_.keys(game.players), function (playerId) {
        return _.has(RULES.GOOD_ROLES, game.players[playerId].role);
    });
}

exports.FilteredGameView = FilteredGameView;
