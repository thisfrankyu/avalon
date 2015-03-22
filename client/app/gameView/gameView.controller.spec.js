'use strict';

describe('Controller: GameViewCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var GameViewCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    GameViewCtrl = $controller('GameViewCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
