'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('endGame', {
        url: '/endGame',
        templateUrl: 'app/endGame/endGame.html',
        controller: 'EndGameCtrl'
      });
  });