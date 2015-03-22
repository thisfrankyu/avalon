'use strict';

angular.module('avalonApp')
  .controller('CreateGameCtrl', function ($scope, $location, socket, game, player) {
    $scope.playerId = '';
    $scope.gameId = '';
    $scope.roles = {
      goodRoles: ['Merlin', 'Percival'],
      badRoles: ['Morgana', 'Mordred', 'Assassin', 'Oberon'],
      selected: {
        goodRoles: {
          MERLIN: true,
          PERCIVAL: false
        },
        badRoles: {
          MORGANA: false,
          MORDRED: false,
          ASSASSIN: true,
          OBERON: false
        }
      }
    };

    function createGame(playerId, gameId, selected) {
      var selectedGoodRoles = _.filter(_.keys(selected.goodRoles), function (key) {
        return selected.goodRoles[key];
      });
      var selectedBadRoles = _.filter(_.keys(selected.badRoles), function (key) {
        return selected.badRoles[key];
      });
      socket.emit('createGame',{
        gameId: gameId,
        gameOptions: {
          badSpecialRoles: selectedBadRoles,
          goodSpecialRoles: selectedGoodRoles
        }
      });
      socket.on('createGameAck', function(msg) {
        console.log(JSON.stringify(msg));
        player.state.id = playerId;
        game.state.badSpecialRoles = msg.gameOptions.badSpecialRoles;
        game.state.goodSpecialRoles = msg.gameOptions.goodSpecialRoles;
        game.state.players = [player.state.id];
        game.state.ownerId = player.state.id;
        game.state.id = msg.gameId;
        console.log('gameState:', JSON.stringify(game.state));
        $location.path('/lobby');
      });
    }

    $scope.registerCreateGame = function(playerId, gameId, selected) {
      socket.emit('registerPlayer', {
        playerId: playerId
      });
      socket.on('registerPlayerAck', function(msg) {
        //alert(JSON.stringify(msg));
        createGame(playerId, gameId, selected);
      });
    };
  });
