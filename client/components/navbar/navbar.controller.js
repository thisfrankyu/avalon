'use strict';

angular.module('avalonApp')
  .controller('NavbarCtrl', function ($scope, $location) {
    $scope.menu = [{
      'title': 'Home',
      'link': '/'
    },{
      'title': 'Create Game',
      'link': '/createGame'
    },{
      'title': 'Join Game',
      'link': '/joinGame'
    },{
      'title': 'Register Player',
      'link': '/registerPlayer'
    }];

    $scope.isCollapsed = true;

    $scope.isActive = function(route) {
      return route === $location.path();
    };
  });
