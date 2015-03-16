'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('createGame', {
        url: '/createGame',
        templateUrl: 'app/createGame/createGame.html',
        controller: 'CreateGameCtrl'
      });
  });
