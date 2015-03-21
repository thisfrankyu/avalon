'use strict';

angular.module('avalonApp')
  .controller('RegisterPlayerCtrl', function ($scope, socket, player) {

    $scope.playerId = 'enter id';

    $scope.registerPlayer = function(playerId) {
      $scope.playerId = playerId;
      player.id = playerId;
      socket.emit('registerPlayer',{
        playerId: $scope.playerId
      });
      socket.on('registerPlayerAck', function(msg) {
        alert(JSON.stringify(msg));
      });
    };
  })
  .config(function ($stateProvider) {
    $stateProvider
      .state('registerPlayer', {
        url: '/registerPlayer',
        templateUrl: 'app/registerPlayer/registerPlayer.html',
        controller: 'RegisterPlayerCtrl'
      });
  });

