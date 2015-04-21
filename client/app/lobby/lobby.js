'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('lobby', {
        url: '/lobby',
        templateUrl: 'app/lobby/lobby.html',
        controller: 'LobbyCtrl'
      });
  });