'use strict';


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
};

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
      VOTE: VOTE
    };
  });
