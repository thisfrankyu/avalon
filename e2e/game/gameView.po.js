/**
 * Created by frank on 3/23/15.
 */
var GameViewPage = function(browser) {
  this.player0SelectQuesterCheckBox = browser.element(by.name('player0'));
  this.player1SelectQuesterCheckBox = browser.element(by.name('player1'));

  this.getSelectPlayerCheckBox = function (index) {
    return browser.element(by.name('player'+index));
  }

  this.submitQuestersButton = browser.element(by.buttonText('Submit Questers'));

  this.acceptQuestersButton = browser.element(by.buttonText('ACCEPT'));
  this.questSuccessButton = browser.element(by.buttonText('SUCCESS'));
};

module.exports = GameViewPage;
