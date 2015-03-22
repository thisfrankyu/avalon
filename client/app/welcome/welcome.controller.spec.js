'use strict';

describe('Controller: WelcomeCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var WelcomeCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WelcomeCtrl = $controller('WelcomeCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
