'use strict';

angular.module('avalonApp')
  .controller('VoteOnQuestersCtrl', function ($scope, $rootScope, $location, $modal, game, player, socket) {
    var modal;
    $scope.game = game;
    socket.on('questRejected', function (msg) {
      $rootScope.$broadcast('stateChanged', game.state.stage);
    });
    socket.on('questAccepted', function (msg) {
      $rootScope.$broadcast('stateChanged', game.state.stage);
    });

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

      $scope.voted = _.reduce(game.state.playerOrder, function (memo, playerId) {
        memo[playerId] = _.has(game.state.currentVotesOnQuest, playerId);
        return memo;
      }, {});
    });

    $rootScope.$on('stageChanged', function (scope, msg) {
      $scope.voted = _.reduce(game.state.playerOrder, function (memo, playerId) {
        memo[playerId] = _.has(game.state.currentVotesOnQuest, playerId);
        return memo;
      }, {});
      if (msg === game.STAGES.VOTE_ON_QUESTERS) {
        if (!_.has(game.state.currentVotesOnQuest, player.state.id)) {
          modal = openVoteModal();
        }
      } else {
        if (modal) {
          modal.dismiss('No longer in the vote on questers stage');
        }
      }
    });
  });
