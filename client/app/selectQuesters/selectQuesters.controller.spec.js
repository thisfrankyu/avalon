'use strict';

describe('Controller: SelectQuestersCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var SelectQuestersCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SelectQuestersCtrl = $controller('SelectQuestersCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
