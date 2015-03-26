'use strict';

angular.module('avalonApp')
  .controller('VoteOnSuccessFailModalCtrl', function ($scope, $rootScope, $modalInstance, socket, game, player) {
    $scope.game = game;
    $scope.player = player;
    $scope.voted = _.reduce(game.state.currentQuest().selectedQuesters, function (memo, playerId) {
      memo[playerId] = false;
      return memo;
    }, {});
    $scope.vote = function(vote){
      socket.emit('voteSuccessFail', {vote: vote, gameId: game.state.id});
    };
    socket.on('votedOnSuccessFail', function (msg) {
      $scope.voted[msg.playerId] = true;
    });

    $scope.isGood = function () {
      return _.has(game.GOOD_ROLES, player.state.role);
    };
    $scope.isOnQuest = function(){
      return _.contains(game.state.currentQuest().selectedQuesters, player.state.id);
    };

    $rootScope.$on('stateChanged', function (scope, msg) {
      if (msg !== game.STAGES.QUEST) $modalInstance.close();
    });
  });
