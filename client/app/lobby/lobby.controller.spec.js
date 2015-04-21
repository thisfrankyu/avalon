'use strict';

describe('Controller: LobbyCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var LobbyCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LobbyCtrl = $controller('LobbyCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
