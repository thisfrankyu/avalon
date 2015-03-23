'use strict';

angular.module('avalonApp')
  .factory('Alert', function () {
    var Alert;

    Alert

    // Public API here
    return Alert = {
      add: function(scope, type, msg) {
        return scope.alerts.push({
          type: type,
          msg: msg,
          close: function() {
            return Alert.closeAlert(scope, this);
          }
        });
      },
      closeAlert: function(scope, alert) {
        return this.closeAlertIdx(scope, scope.alerts.indexOf(alert));
      },
      closeAlertIdx: function(scope, index) {
        return scope.alerts.splice(index, 1);
      },
      clear: function(scope){
        scope.alerts = [];
      }
    };
  });
