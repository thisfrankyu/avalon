'use strict';

angular.module('avalonApp')
  .controller('VoteOnQuestersCtrl', function ($scope, $rootScope, $location, $modal, game, player) {
    var modal;
    $scope.game = game;

    function updateVoted() {
      $scope.voted = _.reduce(game.state.playerOrder, function (memo, playerId) {
        memo[playerId] = _.has(game.state.currentVotesOnQuest, playerId);
        return memo;
      }, {});
    }

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

    $rootScope.$on('gameUpdated', function (scope, msg) {
      if (game.state.stage !== game.STAGES.VOTE_ON_QUESTERS) {
        return;
      }
      updateVoted();
    });

    $rootScope.$on('stageChanged', function (scope, msg) {
      if (msg !== game.STAGES.VOTE_ON_QUESTERS){
        if (modal) {
          modal.dismiss();
        }
        return;
      }
      updateVoted();
      if (!_.has(game.state.currentVotesOnQuest, player.state.id)) {
        modal = openVoteModal();
      }
    });
  });
