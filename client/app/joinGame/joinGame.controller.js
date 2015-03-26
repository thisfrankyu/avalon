'use strict';

angular.module('avalonApp')
  .controller('JoinGameCtrl', function ($scope, $location, socket, game, player) {
    $scope.gameId = '';

    function joinGame(playerId, gameId) {
      socket.emit('joinGame',{
        gameId: gameId
      });
      socket.on('joinGameAck', function(msg) {
        console.log(msg);
        player.state.id = playerId;
        game.state.badSpecialRoles = msg.badSpecialRoles;
        game.state.goodSpecialRoles = msg.goodSpecialRoles;
        game.state.players = _.pluck(msg.players, 'id');
        game.state.ownerId = msg.ownerId;
        game.state.id = msg.gameId;
        console.log('gameState:', JSON.stringify(game.state));
        $location.path('/lobby');
      });
    }

    $scope.registerJoinGame = function(playerId, gameId) {
      socket.emit('registerPlayer', {
        playerId: playerId
      });
      socket.on('registerPlayerAck', function(msg) {
        console.log(msg);
        joinGame(playerId, gameId);
      });
    };
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('joinGame', {
        url: '/joinGame',
        templateUrl: 'app/joinGame/joinGame.html',
        controller: 'JoinGameCtrl'
      });
  });
