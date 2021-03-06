/**
 * The angular resource abstraction that allows us to search campaigns
 *
 * @see ResourceFactory
 */
angular.module('services').factory('SearchCampaigns', ['ResourceFactory',
  function (ResourceFactory) {
    'use strict';

    var resource = ResourceFactory.build(
      '/searchCampaigns/:id',
      '/searchCampaigns/search',
      {id: '@_id'},
      true
    );

    ResourceFactory.applySearch(
      'SearchCampaigns',
      resource,
      'full_name',
      {Text: 'q'}
    );

    return resource;
  }
]);
