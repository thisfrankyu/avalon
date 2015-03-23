'use strict';

describe('Controller: VoteOnSuccessFailCtrl', function () {

  // load the controller's module
  beforeEach(module('avalonApp'));

  var VoteOnSuccessFailCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VoteOnSuccessFailCtrl = $controller('VoteOnSuccessFailCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
