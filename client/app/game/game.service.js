'use strict';


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

function GameState() {
  this.id = null;
  this.ownerId = null;
  this.stage = STAGES.NOT_STARTED;
  this.numSuccesses = 0;
  this.numFails = 0;
  this.numRejections = 0;
  this.questIndex = 0;
  this.quests = [];
  this.currentVotesOnQuest = {};
  this.currentSuccessFailVotes = [];
  this.goodSpecialRoles = [];
  this.badSpecialRoles = [];
  this.kingIndex = 0;
  this.playerOrder= [];
  this.targetedMerlin = null;
}

GameState.prototype.currentKing = function () {
  return this.players[this.kingIndex];
};

GameState.prototype.currentQuest = function () {
  return this.quests[this.questIndex];
};

GameState.prototype.copyFrom = function(gameView) {
  this.id = gameView.id;
  this.ownerId = gameView.ownerId;
  this.stage = gameView.stage;
  this.numSuccesses = gameView.numSuccesses;
  this.numFails = gameView.numFails;
  this.numRejections = gameView.numRejections;
  this.questIndex = gameView.questIndex;
  this.quests = gameView.quests;
  this.currentVotesOnQuest = gameView.currentVotesOnQuest;
  this.currentSuccessFailVotes = gameView.currentSuccessFailVotes;
  this.players = gameView.players;
  this.goodSpecialRoles = gameView.goodSpecialRoles;
  this.badSpecialRoles = gameView.badSpecialRoles;
  this.kingIndex = gameView.kingIndex;
  this.playerOrder= gameView.playerOrder;
  this.targetedMerlin = gameView.targetedMerlin;
};

angular.module('avalonApp')
  .service('game', function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var state = new GameState(),
      VOTE = {
        REJECT: -1,
        ACCEPT: 1,
        FAIL: -1,
        SUCCESS: 1
      };

    return {
      state: state,
      VOTE: VOTE,
      STAGES: STAGES,
      GOOD_ROLES: {
        VILLAGE_IDIOT: 'VILLAGE_IDIOT',
        MERLIN: 'MERLIN',
        PERCIVAL: 'PERCIVAL'
      },
      BAD_ROLES: {
        REGULAR_MINION: 'REGULAR_MINION',
        ASSASSIN: 'ASSASSIN',
        MORGANA: 'MORGANA',
        MORDRED: 'MORDRED',
        OBERON: 'OBERON'
      }
    };
  });
