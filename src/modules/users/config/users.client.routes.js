'use strict';

// Setting up route
angular.module('users').config([
  '$stateProvider', '$urlRouterProvider', 'SessionResolver',
  function($stateProvider, $urlRouterProvider, SessionResolver) {
    $urlRouterProvider
      .when('/user', '/user/campaigns');

    // Users state routing
    $stateProvider.
      state('user', {
        url: '/user',
        templateUrl: 'modules/users/views/user.client.view.html',
        controller: 'UserController'
      }).
      state('user.password', {
        url: '/settings/password',
        resolve: {
          isLoggedIn: SessionResolver.requireLoggedIn,
          currentUser: SessionResolver.requireCurrentUser
        },
        views: {
          'userPanel': {
            templateUrl: 'modules/users/views/settings/change-password.client.view.html',
            controller: 'SettingsController'
          }
        }
      }).
      state('user.forgot', {
        url: '/password/forgot',
        views: {
          'userPanel': {
            templateUrl: 'modules/users/views/password/forgot-password.client.view.html',
            controller: 'PasswordController'
          }
        }
      }).
      state('user.reset-invalid', {
        url: '/password/reset/invalid',
        views: {
          'userPanel': {
            templateUrl: 'modules/users/views/password/reset-password-invalid.client.view.html'
          }
        }
      }).
      state('user.reset-success', {
        url: '/password/reset/success',
        views: {
          'userPanel': {
            templateUrl: 'modules/users/views/password/reset-password-success.client.view.html'
          }
        }
      }).
      state('user.reset', {
        url: '/password/reset/:token',
        views: {
          'userPanel': {
            templateUrl: 'modules/users/views/password/reset-password.client.view.html'
          }
        }
      });
  }
]);
