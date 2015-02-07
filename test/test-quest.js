var test = require('tape');
var _ = require('underscore');

var Quest = require('../game/quest').Quest;
var VOTE = require('../game/quest').VOTE;

test('test selectQuester happy path', function (t) {
    var quest = new Quest(3, 1);
    quest.selectQuester('bob');
    t.ok(quest.selectedQuesters.indexOf('bob') !== -1, 'make sure that the selected quester gets added to the selected questers');
    t.end();
});

test('test cannot add more questers than the number of players for the quest', function (t) {
    var quest = new Quest(3, 1);
    quest.selectQuester('bob');
    quest.selectQuester('alice');
    quest.selectQuester('charlie');
    t.throws(quest.selectQuester.bind(quest, 'eve'), /quest is already full/, 'make sure you cannot add players to a full quest');
    t.end();

});

test('test cannot add duplicate questers to a quest', function (t) {
    var quest = new Quest(3, 1);
    quest.selectQuester('bob');
    t.throws(quest.selectQuester.bind(quest, 'bob'), /cannot add quester that has already been selected/, 'make sure you cannot add duplicate questers');
    t.end();
});

test('test removeQuester happy path', function (t) {
    var quest = new Quest(3, 1);
    quest.selectQuester('bob');
    quest.selectQuester('alice');
    quest.selectQuester('charlie');
    quest.removeQuester('charlie');
    t.deepEqual(quest.selectedQuesters, ['bob', 'alice'], 'make sure only charlie is removed from selectedQuesters');
    t.end();
});

test('test quest.ready()', function(t) {
    var quest = new Quest(4, 2);
    quest.selectQuester('bob');
    quest.selectQuester('alice');
    quest.selectQuester('charlie');
    t.notok(quest.ready(), 'quest should not be ready after 3 are selected if the numPlayers is 4');
    quest.selectQuester('dan');
    t.ok(quest.ready(), 'quest should be ready after 4 are selected if the numPlayers is 4');
    t.end();
});


test('test voteOnAcceotOrReject', function (t) {
    var quest = new Quest(4, 2);
    quest.selectQuester('bob');
    quest.selectQuester('alice');
    quest.selectQuester('charlie');
    t.throws(quest.voteOnAcceptOrReject.bind(quest, []), /cannot vote on accept or reject if quest is not ready/, 'make sure you cannot vote on a quest that is not ready yet');
    quest.selectQuester('dan');
    var passingVote = [VOTE.REJECT, VOTE.ACCEPT, VOTE.REJECT, VOTE.ACCEPT, VOTE.ACCEPT],
        failingVote = [VOTE.REJECT, VOTE.REJECT, VOTE.REJECT, VOTE.ACCEPT, VOTE.ACCEPT],
        equalVote = [VOTE.REJECT, VOTE.REJECT, VOTE.REJECT, VOTE.ACCEPT, VOTE.ACCEPT, VOTE.ACCEPT];
    t.ok(quest.voteOnAcceptOrReject(passingVote), 'make sure passing vote returns pass');
    t.notok(quest.voteOnAcceptOrReject(failingVote), 'make sure failing vote returns fail');
    t.notok(quest.voteOnAcceptOrReject(equalVote), 'make sure equal vote returns fail');
    t.end();
});


test('test voteOnSuccessOrFail', function (t) {
    var quest = new Quest(4, 2),
        passingVote = [VOTE.FAIL, VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS],
        failingVote = [VOTE.FAIL, VOTE.FAIL, VOTE.SUCCESS, VOTE.SUCCESS],
        passingVote2 = [VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS],
        tooManyVotes = [VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS, VOTE.SUCCESS];
    t.ok(quest.voteOnSuccessOrFail(passingVote), 'make sure passing vote returns success');
    t.notok(quest.voteOnSuccessOrFail(failingVote), 'make sure failing vote returns fail');
    t.ok(quest.voteOnSuccessOrFail(passingVote2), 'make sure that other passing vote returns success');
    t.throws(quest.voteOnSuccessOrFail.bind(quest, tooManyVotes), /More votes than number allowed/, 'make sure that you cannot vote with too many players');
    t.end();
});
