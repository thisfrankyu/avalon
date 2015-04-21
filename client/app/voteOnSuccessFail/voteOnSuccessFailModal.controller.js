'use strict';

angular.module('avalonApp')
  .controller('VoteOnSuccessFailModalCtrl', function ($scope, $rootScope, $modalInstance, socket, game, player) {
    $scope.game = game;
    $scope.player = player;

    $scope.hasVoted = function(playerId) {
      return _.contains(game.state.currentSuccessFailVotes, playerId);
    };

    $scope.vote = function(vote){
      socket.emit('voteSuccessFail', {vote: vote, gameId: game.state.id});
    };

    $scope.isGood = function () {
      return _.has(game.GOOD_ROLES, player.state.role);
    };
    $scope.isOnQuest = function(){
      return _.contains(game.state.currentQuest().selectedQuesters, player.state.id);
    };
    $rootScope.$on('gameUpdated', function () {
      if (game.state.stage !== game.STAGES.QUEST){
        $modalInstance.close();
      }
    });

  });
