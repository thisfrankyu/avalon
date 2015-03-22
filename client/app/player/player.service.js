'use strict';

function Player() {
  this.id = null;
  this.role = null;
  this.view = null;
};

angular.module('avalonApp')
  .service('player', function () {
    var player = new Player();
    return {state: player};
  });
