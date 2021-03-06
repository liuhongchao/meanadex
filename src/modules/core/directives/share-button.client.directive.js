'use strict';

/* global Share */

angular.module('core').directive('mdSocialButton', [
  '$timeout',
  function($timeout) {
    return {
      restrict: 'E',
      templateUrl: 'modules/core/views/share-button.client.view.html',
      link: function(scope, element, attrs) {
        $timeout(function() {
          var config = {
            ui: {
              button_font: false
            }
          };
          new Share('.shared-button', config);
        }, 0);
      }
    };
  }
]);
