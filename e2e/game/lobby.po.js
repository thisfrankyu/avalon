/**
 * Created by frank on 3/21/15.
 */
function LobbyPage (browser) {
  this.startGameButton = browser.element(by.buttonText('Start Game'));
};

module.exports = LobbyPage;
