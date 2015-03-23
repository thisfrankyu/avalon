'use strict';

angular.module('avalonApp')
  .controller('VoteOnQuestersCtrl', function ($scope, $location, game, player, socket) {
    $scope.voted = _.reduce(game.state.playerOrder, function (memo, playerId) {
      memo[playerId] = false;
      return memo;
    }, {});
    socket.on('votedOnQuesters', function (msg) {
      $scope.voted[msg.playerId] = true;
    });
    socket.on('questRejected', function (msg) {
      game.state.currentQuest().numRejections++;
    });
    $scope.vote = function(vote){
      socket.emit('voteAcceptReject', {vote: vote});
    };
  });
