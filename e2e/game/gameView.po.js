/**
 * Created by frank on 3/23/15.
 */
var GameViewPage = function(browser) {
  this.player0SelectQuesterCheckBox  = browser.element(by.name('player0'));
  this.player1SelectQuesterCheckBox  = browser.element(by.name('player1'));
  this.submitQuestersButton = browser.element(by.buttonText('Submit Questers'));
};

module.exports = GameViewPage;
