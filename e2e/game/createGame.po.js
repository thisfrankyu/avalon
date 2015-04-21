/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

var CreateGamePage = function(browser) {
  this.playerIdInput = browser.element(by.model('playerId'));
  this.gameIdInput = browser.element(by.model('gameId'));
  this.submitButton = browser.element(by.buttonText('Submit'));
};

module.exports = CreateGamePage;

