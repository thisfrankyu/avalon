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


angular.module('avalonApp')
  .service('game', function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var state = new GameState();
    return {state: state};
  });
