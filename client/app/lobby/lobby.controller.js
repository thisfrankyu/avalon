'use strict';

angular.module('avalonApp')
  .controller('LobbyCtrl', function ($scope, $location, player, game, session, socket) {
    console.log(JSON.stringify(game));
    $scope.player = player;
    $scope.game = game;
    socket.on('gameJoined', function (msg) {
      game.state.players = _.pluck(msg.players, 'id');
    });

    $scope.startGame = function () {
      socket.emit('startGame', {
        gameId: $scope.game.state.id
      });
    };
  });
