'use strict';

angular.module('avalonApp')
  .controller('WelcomeCtrl', function ($scope, $location) {
    $scope.message = 'Hello';
    $scope.createGame = function() {
      $location.path('/createGame');
    };
    $scope.joinGame = function() {
      $location.path('/joinGame');
    };
  });
