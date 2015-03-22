'use strict';

angular.module('avalonApp')
  .controller('GameViewCtrl', function ($scope, game, player) {
    $scope.game = game;
    $scope.player = player;
  });
