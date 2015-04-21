'use strict';

angular.module('avalonApp')
  .controller('KillMerlinCtrl', function ($scope, $rootScope, $modal, socket, game, player) {
    var modal;
    $scope.game = game;

    function openKillMerlinModal(goodPlayerIds, assassinInGame) {
      return $modal.open({
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

    $rootScope.$on('stageChanged', function (scope, msg) {
      if (msg !== game.STAGES.KILL_MERLIN){
        if (modal) {
          modal.dismiss();
        }
        return;
      }

      var assassinInGame = _.contains(game.state.badSpecialRoles, game.BAD_ROLES.ASSASSIN);

      modal = openKillMerlinModal(game.state.goodPlayerIds, assassinInGame);
    });
  });
