'use strict';

angular.module('avalonApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('voteOnSuccessFail', {
        url: '/voteOnSuccessFail',
        templateUrl: 'app/voteOnSuccessFail/voteOnSuccessFail.html',
        controller: 'VoteOnSuccessFailCtrl'
      });
  });