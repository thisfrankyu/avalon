'use strict';

describe('Service: Alert', function () {

  // load the service's module
  beforeEach(module('avalonApp'));

  // instantiate service
  var Alert;
  beforeEach(inject(function (_Alert_) {
    Alert = _Alert_;
  }));

  it('should do something', function () {
    expect(!!Alert).toBe(true);
  });

});
