'use strict';

/* global moment */

angular.module('campaigns').controller('CampaignsSalesDetailsController', [
  '$scope', 'Campaigns', 'CampaignCache', 'mdCanvasService', '$location',
  'Session', 'SessionRedirectService', '$modal',
  function($scope, Campaigns, CampaignCache, mdCanvasService, $location,
           Session, SessionRedirectService, $modal) {

    // No tshirt in cache, can only happen when user browse back in
    // browser after the campaign is launched, we should redirect to
    // the designer page
    $scope.tshirt = CampaignCache.getTshirt();
    if(!$scope.tshirt) {
      $location.path('designer');
    }

    $scope.campaignTitle = CampaignCache.getTitle() || '';
    CampaignCache.bindTitle($scope);

    $scope.campaignDescription = CampaignCache.getDescription() || '';
    CampaignCache.bindDescription($scope);

    $scope.campaignLengths = [5, 7];
    $scope.currentCampaignLength =  $scope.campaignLengths[0];

    $scope.displayCampaignLength = function(days) {
      var endTime = '<span class="campaignLengthEnding">' +
        moment().add(days, 'd').format('MMM Do YYYY, h:mm') + '</span>';
      var calendar = '<span class="fa fa-calendar"/>';
      var date = '<span> ' +  days.toString() + ' days ' +
        '  ' + endTime + '</span>';
      return calendar + date;
    };

    $scope.hideWarning = {
      campaignTitle: true,
      campaignDescription: true,
      tosChecked: true
    };

    $scope.saveDetails = function() {
      var status = 'ok';

      var verifyEmptyFun = function(field, hideErrVar) {
        if(!$scope[field]) {
          $scope.hideWarning[field] = false;
          status = 'not_ok';
        } else {
          $scope.hideWarning[field] = true;
        }
      };

      [
        'campaignTitle',
        'campaignDescription',
        'tosChecked'
      ].forEach(function(obj) {
        verifyEmptyFun(obj);
      });

      if(status !== 'not_ok') {
        $scope.launchCampaign();
      }
    };

    $scope.launchCampaign = function() {
      var tshirt = CampaignCache.getTshirt(),
          variant = tshirt.currentVariant,
          now = new Date();

      if (!Session.isLoggedIn()) {
        return SessionRedirectService.redirectToLogin();
      }

      var campaign = new Campaigns ({
        name: $scope.campaignTitle,
        created: now,
        ended: moment(now).add($scope.currentCampaignLength, 'days').toDate(),
        description: CampaignCache.getDescription(),
        length: $scope.currentCampaignLength,
        goal: parseInt(CampaignCache.getGoal()),
        tshirtRef: tshirt._id,
        tshirt: tshirt,
        price: {
          value: CampaignCache.getPrice(),
          currency: variant.currency
        },
        color: CampaignCache.getColor(),
        design: mdCanvasService.stringifyDesign()
      });

      // Redirect after save
      campaign.$save(
        function(response) {
          CampaignCache.clear();
          $location.path('campaigns/' + response._id);
        },
        function(errorResponse) {
          var error = errorResponse.data.error;
          if(error.statusCode === 413) {
            $modal({
              animation: 'am-fade-and-scale',
              placement: 'center',
              template: 'modules/designer/views/design-too-large.client.view.html'
            });
          } else {
            $modal({
              animation: 'am-fade-and-scale',
              placement: 'center',
              template: 'modules/core/views/unexpected-error.client.view.html'
            });
          }

          $scope.error = error;
        }
      );
    };
  }
]);
