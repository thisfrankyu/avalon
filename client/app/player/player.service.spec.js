'use strict';

describe('Service: player', function () {

  // load the service's module
  beforeEach(module('avalonApp'));

  // instantiate service
  var player;
  beforeEach(inject(function (_player_) {
    player = _player_;
  }));

  it('should do something', function () {
    expect(!!player).toBe(true);
  });

});
