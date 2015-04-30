/* Driver functions for e2e tests */

var HomePage = require('./home.po'),
    CreateGamePage = require('./createGame.po'),
    JoinGamePage = require('./joinGame.po'),
    LobbyPage = require('./lobby.po'),
    GameViewPage = require('./gameView.po');

var driver = {
  getBrowsers: function(originalBrowser, numBrowsers) {
    var browsers = [originalBrowser];
    _.times(numBrowsers - 1, function () {
      browsers.push(originalBrowser.forkNewDriverInstance(false, true));
    });
    return browsers;
  },
  navigate: {
    toHome: function(browser) {
      browser.get('/');
    },
    toCreateGame: function(browser) {
      var page = new HomePage(browser);
      page.createGameButton.click();
    },
    toJoinGame: function(browser) {
      var page = new HomePage(browser);
      page.joinGameButton.click();
    }
  }
};

module.exports = driver;
