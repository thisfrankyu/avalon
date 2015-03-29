'use strict';

angular.module('avalonApp')
  .controller('EndGameModalCtrl', function ($scope, $rootScope, $modalInstance, socket, game, stage) {
    $scope.game = game;
    $scope.stage = stage;
  });
