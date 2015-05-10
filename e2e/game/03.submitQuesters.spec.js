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
  var currentKingPage = null;
  _.each(browsers, function (aBrowser) {
    var gameViewPage = new GameViewPage(aBrowser);
    gameViewPage.submitQuestersButton.isPresent().then(function (isCurrentKing) {
      if (!isCurrentKing) return;
      currentKingPage = gameViewPage;
      _.times(numQuesters[i], function (x) {
        // TODO: move to page object
        gameViewPage.getSelectPlayerCheckBox(x).click();

      });
      gameViewPage.submitQuestersButton.click();
    });
  });
}


describe('submit questers', function () {

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
    while(true){

    }
    _.each(browsers, function (aBrowser, k) {
      var gamePage = new GameViewPage(aBrowser);

    });
  });
});
