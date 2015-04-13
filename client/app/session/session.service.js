'use strict';

angular.module('avalonApp')
  .service('session', function ($rootScope, $location, socket, game, player) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    socket.on('gameStarted', function(msg) {
      game.state.copyFrom(msg.filteredGameView);
      player.state.view = msg.view;
      player.state.role = msg.role;
      $location.path('/game');
    });

    socket.on('gameUpdated', function(msg) {
      game.state.copyFrom(msg.filteredGameView);
      $rootScope.$broadcast('gameUpdated');
    });


    socket.on('stageChanged', function(msg) {
      game.state.copyFrom(msg.filteredGameView);
      $rootScope.$broadcast('stageChanged', game.state.stage);
    });

  });
