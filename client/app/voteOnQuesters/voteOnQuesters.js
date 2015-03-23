'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('voteOnQuesters', {
        url: '/voteOnQuesters',
        templateUrl: 'app/voteOnQuesters/voteOnQuesters.html',
        controller: 'VoteOnQuestersCtrl'
      });
  });