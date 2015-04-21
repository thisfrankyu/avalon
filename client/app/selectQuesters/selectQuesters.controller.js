'use strict';


angular.module('avalonApp')
  .controller('SelectQuestersCtrl', function ($rootScope, $scope, socket, $location, game, player) {
    $scope.game = game;
    $scope.player = player;
    updateSelected();

    function updateSelected() {
      $scope.questers = _.reduce(game.state.playerOrder, function (memo, playerId) {
        memo[playerId] = _.contains(game.state.currentQuest().selectedQuesters, playerId);
        return memo;
      }, {});
    }


    $rootScope.$on('gameUpdated', function (scope, msg) {
      if (game.state.stage !== game.STAGES.SELECT_QUESTERS) {
        return;
      }
      updateSelected();
    });

    function selectQuester(selectedQuesterId) {
      socket.emit('selectQuester', {
        gameId: game.state.id,
        playerId: selectedQuesterId
      });
      socket.once('selectQuesterNack', function () {
        $scope.questers[selectedQuesterId] = false;
      });
      socket.once('selectQuesterAck', function () {
        socket.removeAllListeners('selectQuesterNack');
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
      socket.once('removeQuesterAck', function () {
        socket.removeAllListeners('removeQuesterNack');
      });
    }

    $scope.fireSelectOrRemoveQuester = function (playerId) {
      if ($scope.questers[playerId]) {
        selectQuester(playerId);
      } else {
        removeQuester(playerId);
      }
    };


    $scope.submitQuesters = function () {
      socket.emit('submitQuesters', {
        gameId: game.state.id
      });
    };

    $rootScope.$on('stageChanged', function (scope, msg) {
      if (msg !== game.STAGES.SELECT_QUESTERS) {
        return;
      }
      updateSelected();
    });

  });
