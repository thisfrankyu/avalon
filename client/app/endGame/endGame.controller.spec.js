'use strict';

describe('Controller: EndGameCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var EndGameCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    EndGameCtrl = $controller('EndGameCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
