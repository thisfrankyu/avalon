'use strict';

angular.module('avalonApp')
  .factory('socket', function (socketFactory) {
    return socketFactory();
  });
