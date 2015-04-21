'use strict';

angular.module('avalonApp')
  .controller('VoteOnSuccessFailCtrl', function ($scope, $rootScope, $modal, socket, game) {
    $scope.game = game;
    var modal;

    function openVoteModal() {
      modal = $modal.open({
        templateUrl: 'app/voteOnSuccessFail/voteOnSuccessFail.modal.html',
        controller: 'VoteOnSuccessFailModalCtrl',
        backdrop: 'static',
        keyboard: false,
        resolve: {}
      });
    }

    $rootScope.$on('stageChanged', function (scope, msg) {
      if (msg !== game.STAGES.QUEST) {
        if (modal){
          modal.dismiss();
        }
        return;
      }
      openVoteModal();
    });


  });
