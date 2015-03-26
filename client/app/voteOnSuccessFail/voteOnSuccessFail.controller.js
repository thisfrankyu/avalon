'use strict';

angular.module('avalonApp')
  .controller('VoteOnSuccessFailCtrl', function ($scope, socket, game) {
    $scope.voted = _.reduce(game.state.playerOrder, function (memo, playerId) {
      memo[playerId] = false;
      return memo;
    }, {});
    socket.on('votedOnSuccessFail', function (msg) {
      $scope.voted[msg.playerId] = true;
    });
    socket.on('questEnded', function (msg) {
      console.log(msg.votes + ' quest ' + msg.questResult);
      game.state.currentQuest().result = msg.questResult;
      game.state.questIndex++;
    });
    $scope.vote = function(vote){
      socket.emit('voteSuccessFail', {vote: vote});
    };
  });
