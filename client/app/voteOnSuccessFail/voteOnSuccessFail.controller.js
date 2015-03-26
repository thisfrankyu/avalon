'use strict';

angular.module('avalonApp')
  .controller('VoteOnSuccessFailCtrl', function ($scope, $rootScope, $modal, socket, game) {
    $scope.game = game;

    socket.on('questEnded', function (msg) {
      game.state.currentQuest().result = msg.questResult;
      game.state.questIndex++;
      game.state.kingIndex++;
      game.state.stage = msg.stage;
      $rootScope.$broadcast('stateChanged', game.state.stage);
    });

    function openVoteModal() {
      $modal.open({
        templateUrl: 'app/voteOnSuccessFail/voteOnSuccessFail.modal.html',
        controller: 'VoteOnSuccessFailModalCtrl',
        backdrop: 'static',
        resolve: {}
      });
    }

    $rootScope.$on('stateChanged', function (scope, msg) {
      if (msg !== game.STAGES.QUEST) { return; }
      openVoteModal();
    });


  });
