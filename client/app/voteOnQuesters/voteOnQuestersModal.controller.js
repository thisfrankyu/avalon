angular.module('avalonApp').controller('VoteOnQuestersModalCtrl', function ($scope, $modalInstance, socket, game) {

  $scope.game = game;
  $scope.accept = function () {
    socket.emit('voteAcceptReject', {vote: game.VOTE.ACCEPT, gameId: game.state.id});
    $modalInstance.close();
  };

  $scope.reject = function () {
    socket.emit('voteAcceptReject', {vote: game.VOTE.REJECT, gameId: game.state.id});
    $modalInstance.close();
  };
});
