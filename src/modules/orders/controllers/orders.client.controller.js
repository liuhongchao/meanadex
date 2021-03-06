'use strict';

// Orders controller
angular.module('orders').controller('OrdersController', [
  '$scope', '$stateParams', '$location', 'Orders',
  '$filter', 'DashboardUtils',
  function($scope, $stateParams, $location, Orders,
           $filter, DashboardUtils) {

    $scope.campaignId = $stateParams.campaignId;

    // Remove existing Order
    $scope.remove = function( order ) {
      Orders.remove(
        {id: order._id},
        function(data) {
          for (var i in $scope.orders.documents ) {
            if ($scope.orders.documents [i] === order ) {
              $scope.orders.documents.splice(i, 1);
            }
          }

          // reload table when the current page is empty
          if($scope.orders.documents.length === 0) {
            $scope.loadAllOrdersInTableData();
          }
        },
        function(err) {
          $scope.error = err.data.message;
        }
      );
    };

    // Find a list of Orders
    $scope.find = function() {
      $scope.orders = Orders.query();
    };

    $scope.onRemove = function(order) {
      $scope.remove(order);
      $scope.tableParams.reload();
    };

    $scope.disablePrev = function() {
      return !$scope.orders.prevPage;
    };

    $scope.disableNext = function() {
      return !$scope.orders.nextPage;
    };

    $scope.gotoPage = function(page, disabled) {
      if(!disabled) {
        $scope.loadAllOrdersInTableData(page);
      }
    };

    $scope.tableParams = DashboardUtils.newTableParams(
      function($defer, params) {
        $defer.resolve($scope.orders);
      }
    );
    // Issue: https://github.com/esvit/ng-table/issues/297
    $scope.tableParams.settings().$scope = $scope;

    // Find a list of Orders and load them into order table
    $scope.loadAllOrdersInTableData = function(pageNumber) {
      $scope.orders = Orders.query(
        {
          pageNumber: pageNumber
        },
        function(data) {
          $scope.tableParams.reload();
        });
    };

  }
]);
