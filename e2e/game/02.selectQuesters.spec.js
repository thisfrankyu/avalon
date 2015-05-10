'use strict';
var page,
  _ = require('underscore'),
  CreateGamePage = require('./createGame.po'),
  JoinGamePage = require('./joinGame.po'),
  LobbyPage = require('./lobby.po'),
  GameViewPage = require('./gameView.po'),
  browsers = [browser],
  ownerId = 'player0',
  gameId = 'game0',
  numQuesters = [2, 3, 2];
function startGame(page, ownerId, gameId, browsers) {
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
    joinGamePage.playerIdInput.sendKeys('player' + (i + 1));
    joinGamePage.gameIdInput.sendKeys(gameId);
    joinGamePage.submitButton.click();
  });
  page = new LobbyPage(browser);
  page.startGameButton.click();
  return page;
}
function selectQuesters(browsers, numQuesters, i) {
  _.each(browsers, function (aBrowser) {
    var gameViewPage = new GameViewPage(aBrowser);
    gameViewPage.submitQuestersButton.isPresent().then(function (isCurrentKing) {
      if (!isCurrentKing) return;
      _.times(numQuesters[i], function (x) {
        // TODO: move to page object
        gameViewPage.getSelectPlayerCheckBox(x).click();
      });

    });
  });

}
describe('select questers', function () {

  beforeEach(function () {
    page = startGame(page, ownerId, gameId, browsers);
    selectQuesters(browsers, numQuesters, 0);
    /*_.times(3, function (i) {
      selectQuesters(browsers, numQuesters, i);
      _.each(browsers, function (aBrowser) {
        var gameViewPage = new GameViewPage(aBrowser);
        gameViewPage.acceptQuestersButton.click();
      });
      _.each(browsers, function (aBrowser) {
        var gameViewPage = new GameViewPage(aBrowser);
        gameViewPage.questSuccessButton.isPresent().then(function (isPresent) {
          if (isPresent) {
            gameViewPage.questSuccessButton.isEnabled().then(function (isEnabled) {
              if (isEnabled) {
                gameViewPage.questSuccessButton.click();
              }
            });
          }
        });
      });
    });
    */
  });

  it('should do stuff', function () {
    _.each(browsers, function (aBrowser, k) {
      var gamePage = new GameViewPage(aBrowser);
      gamePage.submitQuestersButton.isPresent().then(function (isCurrentKing) {
        expect(gamePage.getSelectPlayerCheckBox(0).evaluate('questers["player0"]')).toBeTruthy();
        expect(gamePage.getSelectPlayerCheckBox(1).evaluate('questers["player1"]')).toBeTruthy();
        expect(gamePage.getSelectPlayerCheckBox(2).evaluate('questers["player2"]')).toBeFalsy();
        expect(gamePage.getSelectPlayerCheckBox(3).evaluate('questers["player3"]')).toBeFalsy();
        expect(gamePage.getSelectPlayerCheckBox(4).evaluate('questers["player4"]')).toBeFalsy();
      });
    });

  });
});
