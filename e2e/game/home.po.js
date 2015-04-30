var HomePage = function(browser) {
  var util = require('./util');
  this.createGameButton = browser.element(by.buttonText('Create Game'));
  this.joinGameButton = browser.element(by.buttonText('Join Game'));

  var page = this;
  this.expect = {
    createGameButtonPresent: util.expectation('create game button present', function() {
      return page.createGameButton.isPresent();
    }),
    joinGameButtonPresent: util.expectation('join game button present', function() {
      return page.createGameButton.isPresent();
    })
  };
};

module.exports = HomePage;
