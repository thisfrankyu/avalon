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
  this.players = [];
  this.thumbView = [];
  this.quests = [];
  this.kingIndex = 0;
  this.questIndex = 0;
  this.badSpecialRoles = [];
  this.goodSpecialRoles = [];
  this.playerOrder = [];
  this.stage = STAGES.NOT_STARTED;
}

GameState.prototype.currentKing = function () {
  return this.players[this.kingIndex];
};

GameState.prototype.currentQuest = function () {
  return this.quests[this.questIndex];
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
        "VILLAGE_IDIOT": "VILLAGE_IDIOT",
        "MERLIN": "MERLIN",
        "PERCIVAL": "PERCIVAL"
      },
      BAD_ROLES: {
        "REGULAR_MINION": "REGULAR_MINION",
        "ASSASSIN": "ASSASSIN",
        "MORGANA": "MORGANA",
        "MORDRED": "MORDRED",
        "OBERON": "OBERON"
      }
    };
  });
