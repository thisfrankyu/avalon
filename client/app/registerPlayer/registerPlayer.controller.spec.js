'use strict';

describe('Controller: RegisterPlayerCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var RegisterPlayerCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RegisterPlayerCtrl = $controller('RegisterPlayerCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
