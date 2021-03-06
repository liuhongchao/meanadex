'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (
  function() {
    // Init module configuration options
    var applicationModuleName = 'mootee';
    var applicationModuleVendorDependencies = [
      'ngResource',
      'ngCookies',
      'ngAnimate',
      'ngTouch',
      'ngSanitize',
      'ui.router',
      'ui.utils',
      'textAngular',
      'colorpicker.module',
      'ui-rangeSlider',
      'LocalStorageModule',
      'ngTable',
      'angular-data.DS',
      'angularFileUpload',
      'timer',
      'nvd3ChartDirectives',
      'ngTagsInput',
      'mgcrea.ngStrap',
      'ncy-angular-breadcrumb',
      'monospaced.elastic',
      'templates',
      'angular-loading-bar'
    ];

    // Add a new vertical module
    var registerModule = function(moduleName, dependencies) {
      // Create angular module
      angular.module(moduleName, dependencies || []);

      // Add the module to the AngularJS configuration file
      angular.module(applicationModuleName).requires.push(moduleName);
    };

    return {
      applicationModuleName: applicationModuleName,
      applicationModuleVendorDependencies: applicationModuleVendorDependencies,
      registerModule: registerModule
    };
  }
)();
