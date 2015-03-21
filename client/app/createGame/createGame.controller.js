'use strict';

angular.module('avalonApp')
  .controller('CreateGameCtrl', function ($scope, socket) {
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

    $scope.submitRoles = function(selected) {
      var selectedGoodRoles = _.filter(_.keys(selected.goodRoles), function (key) {
        return selected.goodRoles[key];
      });
      var selectedBadRoles = _.filter(_.keys(selected.badRoles), function (key) {
        return selected.badRoles[key];
      });
      socket.emit('createGame',{
        gameId: 'game0',
        gameOptions: {
          badSpecialRoles: selectedBadRoles,
          goodSpecialRoles: selectedGoodRoles
        }
      });
      socket.on('createGameAck', function(msg) {
        console.log(JSON.stringify(msg));
      });
    };
  });
