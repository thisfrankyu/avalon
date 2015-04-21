'use strict';

describe('Controller: VoteOnQuestersCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var VoteOnQuestersCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VoteOnQuestersCtrl = $controller('VoteOnQuestersCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
