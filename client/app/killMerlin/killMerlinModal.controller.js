'use strict';

angular.module('avalonApp')
  .controller('KillMerlinModalCtrl', function ($scope, $rootScope, $modalInstance, socket, game, player, goodPlayerIds, assassinInGame) {
    $scope.game = game;
    $scope.goodPlayerIds = goodPlayerIds;
    $scope.targetedPlayerId = null;
    $scope.targetMerlin = function (targetId) {
      console.log('targetMerlin called with targetId: ', targetId);
      socket.emit('targetMerlin', {
        gameId: game.state.id,
        targetId: targetId
      });
    };
    socket.on('merlinTargeted', function (msg) {
      if (!$scope.canEdit()) $scope.targetedPlayerId = msg.targetId;
    });
    $scope.canEdit = function () {
      if (assassinInGame) return player.state.role === game.BAD_ROLES.ASSASSIN;
      return _.has(game.BAD_ROLES, player.state.role);
    };
    $scope.killMerlin = function(){
      socket.emit('killMerlin', {gameId: game.state.id});
    };
    socket.on('killMerlinAttempted', function () {
      $modalInstance.close();
    });
  });
