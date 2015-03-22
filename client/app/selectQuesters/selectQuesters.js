'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('selectQuesters', {
        url: '/selectQuesters',
        templateUrl: 'app/selectQuesters/selectQuesters.html',
        controller: 'SelectQuestersCtrl'
      });
  });