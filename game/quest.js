/**
 * Created by frank on 2/3/15.
 */
var _ = require('underscore');

var VOTE = {
    REJECT: -1,
    ACCEPT: 1,
    FAIL: -1,
    SUCCESS: 1
}

var QUEST_STATE = {
    UNDECIDED: 0,
    FAILED: -1,
    SUCCEEDED: 1
}

function Quest(numPlayers, numToFail) {
    this.numPlayers = numPlayers;
    this.numToFail = numToFail;
    this.numRejections = 0;
    this.king = null;
    this.selectedQuesters = [];
    this.result = QUEST_STATE.UNDECIDED;
}


Quest.prototype.selectQuester = function (playerId) {
    if (this.selectedQuesters.length >= this.numPlayers) {
        throw new Error('quest is already full');
    }
    if (this.selectedQuesters.indexOf(playerId) !== -1) {
        throw new Error('cannot add quester that has already been selected');
    }
    this.selectedQuesters.push(playerId);
};

Quest.prototype.removeQuester = function(playerId){
    var index = this.selectedQuesters.indexOf(playerId);
    if (index > -1) {
        this.selectedQuesters.splice(index, 1);
    }
};

Quest.prototype.ready = function(){
    return this.selectedQuesters.length === this.numPlayers;
};


Quest.prototype.voteOnAcceptOrReject = function (votes) {
    if(!this.ready()) {
        throw new Error('cannot vote on accept or reject if quest is not ready');
    }
    var netAccepts = _.reduce(votes, function (memo, num) {
        return memo + num;
    }, 0);
    return netAccepts > 0;
};

Quest.prototype.voteOnSuccessOrFail = function (votes) {
    var numFails = _.reduce(votes, function (memo, num) {
        return memo + (num === VOTE.FAIL ? 1 : 0);
    }, 0);
    return numFails >= this.numToFail;
}



exports.Quest = Quest;
exports.QUEST_STATE = QUEST_STATE;
exports.VOTE = VOTE;