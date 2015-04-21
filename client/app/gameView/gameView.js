'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('gameView', {
        url: '/game',
        templateUrl: 'app/gameView/gameView.html',
        controller: 'GameViewCtrl'
      });
  });