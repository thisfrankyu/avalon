'use strict';

angular.module('avalonApp')
  .controller('EndGameModalCtrl', function ($scope, $rootScope, $modalInstance, $location, socket, game, stage) {
    $scope.game = game;
    $scope.stage = stage;

    $scope.createGame = function () {
      $modalInstance.close();
      $location.path('/createGame');
    };

    $scope.joinGame = function () {
      $modalInstance.close();
      $location.path('/joinGame');
    };
  });
