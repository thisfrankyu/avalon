angular.module('avalonApp')
  .controller('JoinGameCtrl', function ($scope, socket) {
    $scope.gameId = 'enter gameId';
    $scope.joinGame = function(gameId) {
      socket.emit('joinGame',{
        gameId: gameId
      });
      socket.on('joinGameAck', function(msg) {
        alert(JSON.stringify(msg));
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
