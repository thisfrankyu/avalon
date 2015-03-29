'use strict';

angular.module('avalonApp')
  .controller('KillMerlinCtrl', function ($scope, $rootScope, $modal, socket, game, player) {
    $scope.game = game;

    function openKillMerlinModal(goodPlayerIds, assassinInGame) {
      console.log('in open kill merlin modal, goodPlayerIds', goodPlayerIds, 'assassinInGame', assassinInGame);
      $modal.open({
        templateUrl: 'app/killMerlin/killMerlin.modal.html',
        controller: 'KillMerlinModalCtrl',
        backdrop: 'static',
        resolve: {
          goodPlayerIds: function () {
            return goodPlayerIds;
          }, assassinInGame: function () {
            return assassinInGame;
          }
        }
      });
    }

    socket.on('killMerlinStage', function (msg) {
      console.log('killMerlinStage received, msg ' + JSON.stringify(msg));
      openKillMerlinModal(msg.goodPlayerIds, msg.assassinInGame);
    });
  });
