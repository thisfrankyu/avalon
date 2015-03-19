'use strict';

angular.module('avalonApp', [
  'btford.socket-io',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/createGame');

    $locationProvider.html5Mode(true);
  });
