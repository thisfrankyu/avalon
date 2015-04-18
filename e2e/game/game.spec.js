'use strict';

describe('stuff View', function () {
  var page,
    _ = require('underscore'),
    CreateGamePage = require('./createGame.po'),
    JoinGamePage = require('./joinGame.po'),
    LobbyPage = require('./lobby.po'),
    GameViewPage = require('./gameView.po'),
    browsers = [browser],
    ownerId = 'player0',
    gameId = 'game0',
    numQuesters = [2,3,2];
  beforeEach(function () {
    browser.get('/createGame');
    page = new CreateGamePage(browser);
    page.playerIdInput.sendKeys(ownerId);
    page.gameIdInput.sendKeys(gameId);
    page.submitButton.click();
    _.times(4, function (i) {
      var joinGameBrowser = browser.forkNewDriverInstance(true),
        joinGamePage = new JoinGamePage(joinGameBrowser);
      joinGameBrowser.get('/joinGame');
      browsers.push(joinGameBrowser);
      joinGamePage.playerIdInput.sendKeys('player'+(i+1));
      joinGamePage.gameIdInput.sendKeys(gameId);
      joinGamePage.submitButton.click();
    });
    page = new LobbyPage(browser);
    page.startGameButton.click();
    _.times(3, function (i) {
      _.each(browsers, function (aBrowser) {
        var gameViewPage = new GameViewPage(aBrowser);
        gameViewPage.submitQuestersButton.isPresent().then(function(isPresent) {
          if(isPresent) {
            _.times(numQuesters[i], function (j) {
              // TODO: move to page object
              gameViewPage.getSelectPlayerCheckBox(j).click();
            });
            gameViewPage.submitQuestersButton.click();
          }
        });
      });
      _.each(browsers, function (aBrowser) {
        var gameViewPage = new GameViewPage(aBrowser);
        gameViewPage.acceptQuestersButton.click();
      });
      _.each(browsers, function (aBrowser) {
        var gameViewPage = new GameViewPage(aBrowser);
        gameViewPage.questSuccessButton.isPresent().then(function(isPresent) {
          if(isPresent) {
            gameViewPage.questSuccessButton.isEnabled().then(function(isEnabled) {
              if(isEnabled) {
                gameViewPage.questSuccessButton.click();
              }
            });
          }
        });
      });
    });
  });

  it('should do stuff', function () {
    while(true){}
  });
});
