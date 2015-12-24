'use strict';

angular.module('avalonApp')
  .controller('EndGameCtrl', function ($scope, $rootScope, $modal, socket, player, game) {
    $scope.game = game;

    function openEndGameModal(stage) {
      $modal.open({
        templateUrl: 'app/endGame/endGame.modal.html',
        controller: 'EndGameModalCtrl',
        resolve: {
          stage: function () {
            return stage;
          }
        }
      });
    }

    $rootScope.$on('stageChanged', function (scope, stage) {
      if (stage === game.STAGES.BAD_WINS) {
        openEndGameModal(stage);
        return;
      }
      if (stage === game.STAGES.GOOD_WINS) {
        openEndGameModal(stage);
        return;
      }
      console.log('stageChanged:', stage);
    });
  });
