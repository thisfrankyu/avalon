'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('killMerlin', {
        url: '/killMerlin',
        templateUrl: 'app/killMerlin/killMerlin.html',
        controller: 'KillMerlinCtrl'
      });
  });