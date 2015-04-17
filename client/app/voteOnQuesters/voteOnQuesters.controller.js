'use strict';

angular.module('avalonApp')
  .controller('VoteOnQuestersCtrl', function ($scope, $rootScope, $location, $modal, game, player) {
    var modal;
    $scope.game = game;

    $scope.hasVoted = function(playerId) {
      return _.has(game.state.currentQuest().votesOnQuest, playerId);
    };

    $scope.getVote = function(playerId) {
      if (game.state.stage === game.STAGES.VOTE_ON_QUESTERS || !$scope.hasVoted(playerId)) {
        return 0;
      }
      return game.state.currentQuest().votesOnQuest[playerId];
    };

    function openVoteModal() {
      return $modal.open({
        templateUrl: 'app/voteOnQuesters/voteOnQuesters.modal.html',
        controller: 'VoteOnQuestersModalCtrl',
        size: 'sm',
        backdrop: 'static',
        keyboard: false,
        resolve: {}
      });
    }

    //$rootScope.$on('gameUpdated', function (scope, msg) { });

    $rootScope.$on('stageChanged', function (scope, msg) {
      if (msg !== game.STAGES.VOTE_ON_QUESTERS){
        if (modal) {
          modal.dismiss();
        }
        return;
      }
      if (!$scope.hasVoted(player.state.id)) {
        modal = openVoteModal();
      }
    });
  });
