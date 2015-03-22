'use strict';


angular.module('avalonApp')
  .controller('SelectQuestersCtrl', function ($scope, socket, $location, player, game) {

    function selectQuester(selectedQuesterId) {
      socket.emit('selectQuester', {
        gameId: game.state.id,
        playerId: selectedQuesterId
      });
      socket.once('selectQuesterNack', function () {
        $scope.questers[selectedQuesterId] = false;
      });
    }

    function removeQuester(selectedQuesterId) {
      socket.emit('removeQuester', {
        gameId: game.state.id,
        playerId: selectedQuesterId
      });
      socket.once('removeQuesterNack', function () {
        $scope.questers[selectedQuesterId] = true;
      });
    }

    function setupSelectAndRemoveQuesters() {
      _.each($scope.questers, function (selected, playerId) {
        $scope.$watch('questers[' + playerId + ']', function (newValue) {
          if (newValue) {
            selectQuester(playerId);
          } else {
            removeQuester(playerId);
          }
        });
      });
    }


    $scope.questers = _.reduce(game.state.playerOrder, function (memo, playerId) {
      memo[playerId] = false;
      return memo;
    }, {});

    if (player.state.id === game.state.playerOrder[game.state.kingIndex]) {
      setupSelectAndRemoveQuesters();
    } else {
      socket.on('questerSelected', function (msg) {
        $scope.questers[msg.selectedQuesterId] = true;
      });
      socket.on('questerRemoved', function (msg) {
        $scope.questers[msg.removedQuesterId] = false;
      });
    }

  });
