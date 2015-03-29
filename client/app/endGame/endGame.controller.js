'use strict';

angular.module('avalonApp')
  .controller('EndGameCtrl', function ($scope, $rootScope, $modal, socket, game, player) {
    $scope.game = game;

    function openEndGameModal(stage) {
      $modal.open({
        templateUrl: 'app/endGame/endGame.modal.html',
        controller: 'EndGameModalCtrl',
        backdrop: 'static',
        resolve: {
          stage: function(){
            return stage;
          }
        }
      });
    }

    socket.on('killMerlinAttempted', function (msg) {
      console.log('killMerlinAttempted received, msg ' + JSON.stringify(msg));
      openEndGameModal(msg.stage);
    });
  });
