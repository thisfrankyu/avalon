var test = require('tape');
var _ = require('underscore');

var engine = require('../game/engine');
var QUEST = require('../game/quest');
var Game = engine.Game;
var Player = require('../game/player');
var RULES = require('../game/rules');
var VIEW = RULES.VIEW;
var STAGES = engine.STAGES;
var VOTE = QUEST.VOTE;
var QUEST_STATE = QUEST.QUEST_STATE;

test('test that all the special roles passed in are included in the roles assigned', function (t) {
    var goodSpecialRoles = ["MERLIN", "PERCIVAL"],
        badSpecialRoles = ["ASSASSIN", "MORGANA"],
        game = new Game('bobgame', 'player0', {});
    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }
    game.setGoodSpecialRoles(goodSpecialRoles);
    game.setBadSpecialRoles(badSpecialRoles);
    game._assignRoles();
    _.each(game.goodSpecialRoles, function (role) {
        t.ok(_.contains(_.values(game.roles), role), 'make sure ' + role + ' is in roles');
    });
    _.each(game.badSpecialRoles, function (role) {
        t.ok(_.contains(_.values(game.roles), role), 'make sure ' + role + ' is in roles');
    });
    t.end();
});

test('test malformed player', function (t) {
    var game = new Game('badPlayer', 'player0');

    t.throws(game.addPlayer.bind(game, {}), /malformed player/, 'make sure malformed player error is thrown');

    t.end();
});

test('test too many good special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 5; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /chose too many good special roles/, 'make sure you cannot provide too many good people');

    t.end();
});

test('test too many bad special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "MORGANA", "MORDRED", "OBERON"]
    });

    for (var i = 0; i < 5; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /chose too many bad special roles/, 'make sure you cannot provide too many bad people');

    t.end();
});

test('test invalid good special role', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "PHOEBE"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /is not a special role/, 'make sure you cannot provide a non-existent good role');

    t.end();
});

test('test invalid bad special role', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "FRANK"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /is not a special role/, 'make sure you cannot provide a non-existent bad role');

    t.end();
});

test('test duplicate good special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL", "MERLIN"],
        badSpecialRoles: ["ASSASSIN", "MORGANA"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /Cannot provide duplicate special roles/, 'make sure you cannot provide duplicate good people');

    t.end();
});

test('test duplicate bad special roles', function (t) {
    var game = new Game('bobgame', 'player0', {
        goodSpecialRoles: ["MERLIN", "PERCIVAL"],
        badSpecialRoles: ["ASSASSIN", "ASSASSIN"]
    });

    for (var i = 0; i < 10; i++) {
        game.addPlayer(new Player('player' + i));
    }

    t.throws(game._assignRoles.bind(game), /Cannot provide duplicate special roles/, 'make sure you cannot provide duplicate bad people');

    t.end();
});

test('test player order', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    game.start();
    t.equal(game.playerOrder.length, players.length, 'Make sure there are the right number of players in the game');
    players.forEach(function (player) {
        t.ok(game.playerOrder.indexOf(player.id) !== -1, 'Each player should be given a spot in the order');
    });

    t.equal(game.currentKing(), game.playerOrder[0], 'The first player should be the king first');
    t.equal(game.stage, STAGES.SELECT_QUESTERS, 'The game stage after the game starts should be SELECT QUESTERS');

    t.end();
});

test('test player views (all special roles)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED", "MORGANA", "OBERON"]
        }),
        players = [];

    _.times(10, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    game.start();
    players.forEach(function (player) {
        if (!player.view.length) {
            t.deepEqual(player.view, VIEW[player.role], 'Test that the player who is ' + player.role + ' cannot see anyone');
        }

        _.each(player.view, function (viewed) {
            t.ok(VIEW[player.role].indexOf(game.roles[viewed]) !== -1, "Test that the player who is " +
            player.role + ' can see ' + viewed + ' (' + game.roles[viewed] + ')')
        });
    });

    t.end();
});

test('test player views (with regular minion)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED", "MORGANA"]
        }),
        players = [];

    _.times(10, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    game.start();
    players.forEach(function (player) {
        if (!player.view.length) {
            t.deepEqual(player.view, VIEW[player.role], 'Test that the player who is ' + player.role + ' cannot see anyone');
        }

        _.each(player.view, function (viewed) {
            t.ok(VIEW[player.role].indexOf(game.roles[viewed]) !== -1, "Test that the player who is " +
            player.role + ' can see ' + viewed + ' (' + game.roles[viewed] + ')')
        });
    });

    t.end();
});

test('test start game before 5 have joined)', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(4, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    t.throws(game.start.bind(game), /Invalid number of players/, 'Cannot start a game before at least 5 people have joined');


    t.end();
});

test('test add not enough players', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(4, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    t.throws(game.start.bind(game), /Invalid number of players/,
        'Cannot start a game before at least 5 people have joined');
    t.end();
});

test('test add too many players', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(11, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    t.throws(game.start.bind(game), /Invalid number of players/,
        'Cannot start if too many players are in the game');
    t.end();
});

test('test no adding players after game has started', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(5, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    t.throws(game._createQuests.bind(game), /cannot create quests after the game has started/,
        'make sure you cannot call private create quests');
    t.throws(game.start.bind(game), /tried to start game after game started/,
        'make sure you cannot call start after it has been called');
    t.throws(game.addPlayer.bind(game, new Player('playerX')), /cannot add a player after the game has started/,
        'cannot add a player after the game has started');
    t.end();
});

test('test select/remove Quester', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    t.throws(game.selectQuester.bind(game), /called selectQuester while not in SELECT_QUESTERS stage/,
        'make sure that you cannot select a quester when you are not in the select questers stage');

    //START
    game.start();


    t.throws(game.selectQuester.bind(game, players[0].id, game.playerOrder[1]), /Only the king may select players for a quest/,
        'Make sure that a non-king player cannot choose the questers');
    t.throws(game.selectQuester.bind(game, 'playerX', game.playerOrder[0]), /is not in the game/,
        'Make sure that only real players can be added to a quest');
    var king = game.currentKing();

    game.selectQuester(players[0].id, king);
    game.selectQuester(players[1].id, king);

    var selectedQuesters = game.currentQuest().selectedQuesters;
    var sortedSelectedQuesters = _.sortBy(selectedQuesters, function (str) {
        return str;
    });
    t.deepEqual(sortedSelectedQuesters, [players[0].id, players[1].id].sort(),
        'Make sure that the players we added are in selected questers');

    game.removeQuester(players[1].id, king);

    t.deepEqual(selectedQuesters, [players[0].id],
        'make sure that after removing player[1], only player[0] remains');

    game.selectQuester(players[2].id, king);

    sortedSelectedQuesters = _.sortBy(selectedQuesters, function (str) {
        return str;
    });
    t.deepEqual(sortedSelectedQuesters, [players[0].id, players[2].id].sort(),
        'make sure that after removing player[1], and adding player[2], 0 and 2 are in the selected questers list');
    t.end();
});

test('test vote on questers ACCEPT', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    //START
    game.start();

    var king = game.currentKing();

    t.throws(game.voteAcceptReject.bind(game, 'player0', VOTE.ACCEPT),
        /Tried to vote on quest when not in vote stage/,
        'Should not be able to vote before questers have been selected');
    game.selectQuester(players[0].id, king);
    t.throws(game.submitQuestersForVoting.bind(game, king),
        /Cannot submit questers until enough questers have been chosen/,
        'Make sure that we cannot submit quester before we have chosen enough questers');
    game.selectQuester(players[1].id, king);
    game.submitQuestersForVoting(king);
    t.equal(game.stage, STAGES.VOTE_ON_QUESTERS,
        'After submitting the questers, we should be ready to vote on them');
    game.voteAcceptReject('player0', VOTE.ACCEPT);
    game.voteAcceptReject('player1', VOTE.ACCEPT);
    game.voteAcceptReject('player2', VOTE.ACCEPT);
    game.voteAcceptReject('player3', VOTE.ACCEPT);
    game.voteAcceptReject('player4', VOTE.ACCEPT);
    game.voteAcceptReject('player5', VOTE.ACCEPT);
    t.equal(game.stage, STAGES.QUEST,
        'Since the questers were accepted, we should be in the QUEST stage');
    t.notEqual(king, game.currentKing(),
        'The king should have changed after the quest was not accepted');
    t.end();
});

test('test vote on questers REJECT', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [];

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    //START
    game.start();
    t.equal(game.stage, STAGES.SELECT_QUESTERS,
        'After we have started, we should enter the SELECT_QUESTERS stage');

    _.times(4, function (i) {
        var king = game.currentKing();
        game.selectQuester(players[0].id, king);
        game.selectQuester(players[1].id, king);
        game.submitQuestersForVoting(king);
        t.equal(game.stage, STAGES.VOTE_ON_QUESTERS,
            'After submitting the questers, we should be ready to vote on them');
        voteOnAcceptOrReject(game, 4);
        t.equal(game.stage, STAGES.SELECT_QUESTERS,
            'Since the questers were rejected, ' +
            'we should be in the SELECT_QUESTERS stage');
        t.notEqual(king, game.currentKing(),
            'The king should have changed after the quest was not accepted, old king: ' + king + ', new king: ' + game.currentKing());
    });
    var king = game.currentKing();
    game.selectQuester(players[0].id, king);
    game.selectQuester(players[1].id, king);
    game.submitQuestersForVoting(king);
    voteOnAcceptOrReject(game, 4);
    t.equal(game.stage, STAGES.BAD_WINS, 'if a quest is rejected five times, bad wins');
    t.end();
});

test('test go on quest', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [],
        king, quest;

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });

    //START
    game.start();
    t.equal(game.stage, STAGES.SELECT_QUESTERS,
        'After we have started, we should enter the SELECT_QUESTERS stage');

    king = game.currentKing();
    quest = game.currentQuest();
    game.selectQuester(players[0].id, king);
    game.selectQuester(players[1].id, king);
    t.throws(game.voteSuccessFail.bind(game, 'player0', VOTE.SUCCESS),
        /Tried to vote on success or fail before quest was started/,
        'Should not be able to vote success or fail before the quest');
    game.submitQuestersForVoting(king);
    t.equal(game.stage, STAGES.VOTE_ON_QUESTERS,
        'After submitting the questers, we should be ready to vote on them');
    voteOnAcceptOrReject(game, 0);

    t.throws(game.voteSuccessFail.bind(game, 'player4', VOTE.SUCCESS),
        /Player is not on quest!/,
        'Player who is not on the quest cannot vote on the quest');

    t.deepEqual(quest, game.currentQuest(), 'quest should point to currentQuest before voting');
    game.voteSuccessFail('player0', VOTE.SUCCESS);

    game.voteSuccessFail('player1', VOTE.SUCCESS);

    t.equal(game.stage, STAGES.SELECT_QUESTERS,
        'Once the votes are done, we should be back to selecting questers');

    t.notDeepEqual(quest, game.currentQuest(), 'quest should no longer point to currentQuest');
    t.equal(quest.result, QUEST_STATE.SUCCEEDED, 'quest should have succeeded');
    quest = game.currentQuest();
    goOnQuestWithNumFails(t, game, 2); //this should fail
    t.equal(quest.result, QUEST_STATE.FAILED, 'quest should have failed');

    t.end();
});

test('test good wins on 3 succeeded quest', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [],
        king, quest;

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    goOnQuestWithNumFails(t, game, 0); //this should succeed
    goOnQuestWithNumFails(t, game, 0); //this should succeed
    goOnQuestWithNumFails(t, game, 0); //this should succeed
    t.equal(game.stage, STAGES.KILL_MERLIN, 'game should be in kill merlin after 3 succeeds');
    t.end();
});


test('test bad wins on 3 failed quests', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [],
        king, quest;

    _.times(6, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    t.equal(game.stage, STAGES.BAD_WINS, 'game should be in BAD_WINS after 3 fails');
    t.end();
});


test('test good wins on 3-2 ', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN"]
        }),
        players = [],
        king, quest;

    _.times(7, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    goOnQuestWithNumFails(t, game, 0); //this should pass
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should pass
    goOnQuestWithNumFails(t, game, 0); //this should pass
    t.equal(game.stage, STAGES.KILL_MERLIN, 'game should be in KILL MERLIN after 3 succeeds');
    t.end();
});

test('test good wins on 3-2 ', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED"]
        }),
        players = [],
        rolesToPlayers,
        ASSASSIN = RULES.BAD_ROLES.ASSASSIN;

    _.times(7, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    rolesToPlayers = _.invert(game.roles);
    goOnQuestWithNumFails(t, game, 0); //this should pass
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should pass
    t.throws(game.targetMerlin.bind(game, rolesToPlayers[RULES.GOOD_ROLES.PERCIVAL], rolesToPlayers[RULES.GOOD_ROLES.MERLIN]),
        /tried to target merlin/, 'make you cannot target merlin before kill merlin stage');
    goOnQuestWithNumFails(t, game, 0); //this should pass
    t.equal(game.stage, STAGES.KILL_MERLIN, 'game should be in KILL MERLIN after 3 succeeds');
    t.throws(game.targetMerlin.bind(game, rolesToPlayers[RULES.GOOD_ROLES.PERCIVAL], rolesToPlayers[RULES.GOOD_ROLES.MERLIN]),
        /is not bad/, 'make sure a good player cannot target a merlin');
    t.throws(game.targetMerlin.bind(game, rolesToPlayers[RULES.GOOD_ROLES.MERLIN], rolesToPlayers[RULES.BAD_ROLES.MORDRED]),
        /only the assassin can target a possible merlin/, 'make sure if the assassin is in the game, another bad person cannot try to target a merlin');

    t.throws(game.killTargetMerlin.bind(game, rolesToPlayers[ASSASSIN]), /must target a merlin before killing/, 'make sure that cannot kill a merlin before a merlin is targeted');
    game.targetMerlin(rolesToPlayers[RULES.GOOD_ROLES.PERCIVAL], rolesToPlayers[ASSASSIN]);
    game.killTargetMerlin(rolesToPlayers[ASSASSIN]);
    t.equal(game.stage, STAGES.GOOD_WINS, 'if bad misses merlin, then good should win');
    t.end();
});


test('test bad wins on 3-2 kill merlin', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["ASSASSIN", "MORDRED"]
        }),
        players = [],
        rolesToPlayers,
        ASSASSIN = RULES.BAD_ROLES.ASSASSIN;

    _.times(7, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    rolesToPlayers = _.invert(game.roles);
    goOnQuestWithNumFails(t, game, 0); //this should pass
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should pass
    goOnQuestWithNumFails(t, game, 0); //this should pass
    game.targetMerlin(rolesToPlayers[RULES.GOOD_ROLES.MERLIN], rolesToPlayers[ASSASSIN]);
    game.killTargetMerlin(rolesToPlayers[ASSASSIN]);
    t.equal(game.stage, STAGES.BAD_WINS, 'if bad hits merlin, then bad should win');
    t.end();
});


test('test bad wins on 3-2 kill merlin', function (t) {
    var game = new Game('bobgame', 'player0', {
            goodSpecialRoles: ["MERLIN", "PERCIVAL"],
            badSpecialRoles: ["MORGANA", "MORDRED"]
        }),
        players = [],
        rolesToPlayers,
        MORGANA = RULES.BAD_ROLES.MORGANA,
        MORDRED = RULES.BAD_ROLES.MORDRED;

    _.times(7, function (n) {
        players.push(new Player('player' + n));
        game.addPlayer(players[n]);
    });
    game.start();
    rolesToPlayers = _.invert(game.roles);
    goOnQuestWithNumFails(t, game, 0); //this should pass
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should fail
    goOnQuestWithNumFails(t, game, 1); //this should pass
    goOnQuestWithNumFails(t, game, 0); //this should pass
    game.targetMerlin(rolesToPlayers[RULES.GOOD_ROLES.MERLIN], rolesToPlayers[MORGANA]);
    game.targetMerlin(rolesToPlayers[RULES.GOOD_ROLES.MERLIN], rolesToPlayers[MORDRED]);
    game.killTargetMerlin(rolesToPlayers[MORGANA]);
    t.equal(game.stage, STAGES.BAD_WINS, 'if bad hits merlin, then bad should win');
    t.end();
});




function goOnQuestWithNumFails(t, game, numBad) {
    var king = game.currentKing(),
        partitions = _.partition(Object.keys(game.roles), function (playerId) {
            return RULES.BAD_ROLES.hasOwnProperty(game.roles[playerId]);
        }),
        baddies = partitions[0],
        goodies = partitions[1],
        baddiesOnQuest = [],
        goodiesOnQuest = [];
    _.times(game.currentQuest().numPlayers, function (i) {
        if (i < numBad) {
            var baddy = baddies[i];
            game.selectQuester(baddy, king);
            baddiesOnQuest.push(baddy);
        } else {
            var goody = goodies[i - numBad];
            game.selectQuester(goody, king);
            goodiesOnQuest.push(goody);
        }
    });
    game.submitQuestersForVoting(king);
    voteOnAcceptOrReject(game, 0);
    _.each(goodiesOnQuest, function (goody) {
        t.throws(game.voteSuccessFail.bind(game, goody, VOTE.FAIL), /Good players cannot vote fail on a quest/, 'make sure good player cannot vote fail');
        game.voteSuccessFail(goody, VOTE.SUCCESS);

    });
    _.each(baddiesOnQuest, function (baddy) {
        game.voteSuccessFail(baddy, VOTE.FAIL);

    });
}

function voteOnAcceptOrReject(game, numRejects) {
    var players = _.keys(game.players);
    _.times(players.length, function (i) {
        game.voteAcceptReject(players[i], i < numRejects ? VOTE.REJECT : VOTE.ACCEPT);
    });
}