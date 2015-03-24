'use strict';

angular.module('avalonApp')
  .controller('LobbyCtrl', function ($scope, $location, player, game, socket) {
    console.log(JSON.stringify(game));
    $scope.player = player;
    $scope.game = game;
    socket.on('gameJoined', function(msg) {
      //alert('gotGameJoined' + JSON.stringify(msg));
      game.state.players = _.pluck(msg.players, 'id');
    });

    socket.on('gameStarted', function(msg) {
      game.state.playerOrder = msg.playerOrder;
      game.state.quests = msg.quests;
      player.state.view = msg.view;
      player.state.role = msg.role;
      game.state.stage = game.STAGES.SELECT_QUESTERS;
      $location.path('/game');
    });

    $scope.startGame = function() {
      socket.emit('startGame', {
        gameId: $scope.game.state.id
      });
    };
  });
