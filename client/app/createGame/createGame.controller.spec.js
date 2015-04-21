'use strict';

describe('Controller: CreateGameCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var CreateGameCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CreateGameCtrl = $controller('CreateGameCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
