'use strict';

angular.module('avalonApp')
  .controller('GameViewCtrl', function ($scope, session, game, player) {
    $scope.game = game;
    $scope.player = player;
  });
