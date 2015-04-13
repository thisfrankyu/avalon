var _ = require('underscore');

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
    this.playerOrder= game.playerOrder;
    this.targetedMerlin = game.targetedMerlin;
}

exports.FilteredGameView = FilteredGameView;