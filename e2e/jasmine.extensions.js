jasmine.Matchers.matcherFn_ = function(matcherName, matcherFunction) {
  return function() {
    var matcherArgs = jasmine.util.argsToArray(arguments);
    var result = matcherFunction.apply(this, arguments);

    if (this.isNot) {
      result = !result;
    }

    var spec = jasmine.getEnv().currentSpec;
    if (this.reportWasCalled_) return result;

    var message;
    if (!result) {
      if (this.message) {
        message = this.message.apply(this, arguments);
        if (jasmine.isArray_(message)) {
          message = message[this.isNot ? 1 : 0];
        }
      } else {
        var englishyPredicate = matcherName.replace(/[A-Z]/g, function(s) { return ' ' + s.toLowerCase(); });
        message = "Expected " + jasmine.pp(this.actual) + (this.isNot ? " not " : " ") + englishyPredicate;
        if (matcherArgs.length > 0) {
          for (var i = 0; i < matcherArgs.length; i++) {
            if (i > 0) message += ",";
            message += " " + jasmine.pp(matcherArgs[i]);
          }
        }
        message += ".";
      }
    }
    if (this.becauseMsg) {
      message = this.becauseMsg + ': ' + message;
    }
    var expectationResult = new jasmine.ExpectationResult({
      matcherName: matcherName,
      passed: result,
      expected: matcherArgs.length > 1 ? matcherArgs : matcherArgs[0],
      actual: this.actual,
      message: message
    });
    this.spec.addMatcherResult(expectationResult);
    return jasmine.undefined;
  };
};

var originalMatcherFn = jasmine.Matchers.matcherFn_;
jasmine.Matchers.matcherFn_ = function(matcherName, matcherFunction) {
  var matcherFnThis = this;
  var matcherFnArgs = jasmine.util.argsToArray(arguments);

  return function() {
    var matcherThis = this;
    var matcherArgs = jasmine.util.argsToArray(arguments);

    var actualPromise = protractor.promise.fulfilled(this.actual);
    var expectedPromises = matcherArgs.map(protractor.promise.fulfilled);

    protractor.promise.all([ actualPromise ].concat(expectedPromises)).then(function(results) {
      matcherThis.actual = results.shift();
      matcherArgs = results;

      var result = matcherFunction.apply(matcherThis, matcherArgs);

      if (result instanceof protractor.promise.Promise) {
        result.then(function(resolution) {
          matcherFnArgs[1] = function() {
            return resolution;
          };
          originalMatcherFn.apply(matcherFnThis, matcherFnArgs).
            apply(matcherThis, matcherArgs);
        });
      } else {
        originalMatcherFn.apply(matcherFnThis, matcherFnArgs).
          apply(matcherThis, matcherArgs);
      }
    });
  };
};

jasmine.Matchers.wrapInto_(jasmine.Matchers.prototype, jasmine.getEnv().matchersClass);

global.expect = function(actual) {
  return jasmine.getEnv().currentSpec.expect(actual);
};
