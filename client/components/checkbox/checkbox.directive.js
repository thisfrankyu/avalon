'use strict';

// originally from https://github.com/sebastianha/angular-bootstrap-checkbox, modified to get rid of ng-class

angular.module('avalonApp').directive('checkbox', function() {
  return {
    scope: {},
    require: 'ngModel',
    restrict: 'E',
    replace: 'true',
    template: '<button type="button" ng-style="stylebtn" class="btn btn-default">' +
    '<span ng-style="styleicon" class="glyphicon" ng-class="{\'glyphicon-ok\': checked===true}"></span>' +
    '</button>',
    link: function(scope, elem, attrs, modelCtrl) {
      // Default Button Styling
      scope.stylebtn = {};
      // Default Checkmark Styling
      scope.styleicon = {'width': '10px', 'left': '-1px'};
      // If size is undefined, Checkbox has normal size (Bootstrap 'xs')
      if(attrs.large !== undefined) {
        elem.addClass('btn-sm');
        scope.stylebtn = {'padding-top': '2px', 'padding-bottom': '2px', 'height': '30px'};
        scope.styleicon = {'width': '8px', 'left': '-5px', 'font-size': '17px'};
      }
      else if(attrs.larger !== undefined) {
        scope.stylebtn = {'padding-top': '2px', 'padding-bottom': '2px', 'height': '34px'};
        scope.styleicon = {'width': '8px', 'left': '-8px', 'font-size': '22px'};
      }
      else if(attrs.largest !== undefined) {
        elem.addClass('btn-lg');
        scope.stylebtn = {'padding-top': '2px', 'padding-bottom': '2px', 'height': '45px'};
        scope.styleicon = {'width': '11px', 'left': '-11px', 'font-size': '30px'};
      }
      else {
        elem.addClass('btn-xs');
      }

      var trueValue = true;
      var falseValue = false;

      // If defined set true value
      if(attrs.ngTrueValue !== undefined) {
        trueValue = attrs.ngTrueValue;
      }
      // If defined set false value
      if(attrs.ngFalseValue !== undefined) {
        falseValue = attrs.ngFalseValue;
      }

      // Check if name attribute is set and if so add it to the DOM element
      if(scope.name !== undefined) {
        elem.name = scope.name;
      }

      // Update element when model changes
      scope.$watch(function() {
        if(modelCtrl.$modelValue === trueValue || modelCtrl.$modelValue === true) {
          modelCtrl.$setViewValue(trueValue);
        } else {
          modelCtrl.$setViewValue(falseValue);
        }
        return modelCtrl.$modelValue;
      }, function() {
        scope.checked = modelCtrl.$modelValue === trueValue;
      }, true);

      // On click swap value and trigger onChange function
      elem.bind('click', function() {
        scope.$apply(function() {
          if(modelCtrl.$modelValue === falseValue) {
            modelCtrl.$setViewValue(trueValue);
          } else {
            modelCtrl.$setViewValue(falseValue);
          }
        });
      });
    }
  };
});
