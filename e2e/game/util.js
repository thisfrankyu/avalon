var util = {
  expectation: function(description, actual) {
    return function(param) { return because(description).expect(actual(param)); };
  },
  when: function(condition, func) {
    return function() {
      var promise = protractor.promise.when(_.isFunction(condition) ? condition() : condition), spec = this;
      promise.then(function(value) {
        if(value) func.call(spec);
        else if(spec.results_) spec.results_.skipped = true;
      });
    };
  }
};

module.exports = util;
