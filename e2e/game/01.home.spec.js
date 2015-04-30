'use strict';

describe('Home Screen', function () {
  var driver = require('./driver'),
      HomePage = require('./home.po'),
      page;

  beforeEach(function() {
    page = new HomePage(browser);
    driver.navigate.toHome(browser);
  });

  it('should show create and join game buttons', function () {
    page.expect.createGameButtonPresent().toBe(true);
    page.expect.joinGameButtonPresent().toBe(true);
  });
});
