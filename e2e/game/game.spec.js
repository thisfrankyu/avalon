'use strict';

describe('stuff View', function () {
  var page,
    _ = require('underscore'),
    CreateGamePage = require('./createGame.po'),
    JoinGamePage = require('./joinGame.po'),
    LobbyPage = require('./lobby.po'),
    joinGameBrowsers = [],
    ownerId = 'player0',
    gameId = 'game0';
  beforeEach(function () {
    browser.get('/createGame');
    page = new CreateGamePage(browser);
    page.playerIdInput.sendKeys(ownerId);
    page.gameIdInput.sendKeys(gameId);
    page.submitButton.click();
    _.times(5, function (i) {
      var joinGameBrowser = browser.forkNewDriverInstance(true),
        joinGamePage = new JoinGamePage(joinGameBrowser);
      joinGameBrowser.get('/joinGame');
      joinGameBrowsers.push[joinGameBrowser];
      joinGamePage.playerIdInput.sendKeys('player'+(i+1));
      joinGamePage.gameIdInput.sendKeys(gameId);
      joinGamePage.submitButton.click();
    });
    page = new LobbyPage(browser);
    page.startGameButton.click();
  });

  it('should do stuff', function () {
    browser.sleep(100000);
  });
});
