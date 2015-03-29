'use strict';

describe('Controller: KillMerlinCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var KillMerlinCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    KillMerlinCtrl = $controller('KillMerlinCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
