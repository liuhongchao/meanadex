'use strict';

/* global moment */
/* global d3 */

angular.module('dashboard').directive('dashboardGraph', [
  '$timeout',
  function($timeout) {
    return {
      scope: {
        loadData: '&'
      },
      restrict: 'E',
      templateUrl: 'modules/dashboard/views/dashboard-graph.client.view.html',
      link: function(scope, element, attr) {
        // start is a moment/date
        var categorizeByDay = function(ts, start, end) {
          var diff = end.diff(start, 'days');
          var format = 'DD/MM/YY';
          var map = _.reduce(
            _.range(diff+1),
            function(acc, difference) {
              var key = start.clone().add(difference, 'days').format(format);
              acc[key] = 0;
              return acc;
            },
            {}
          );

          _.each(ts, function(t) {
            var date = t.format(format);
            if(_.isNumber(map[date])) {
              map[date]++;
            }
          });

          return _.map(
            _.pairs(map),
            function(m) {
              return [moment(m[0], format).format('x'), m[1]];
            }
          );
        };

        scope.today = Date.today();
        scope.toDate = Date.today();
        scope.fromDate = Date.today().addDays(-7); // week ago

        scope.reloadData = function() {
          var start = moment(scope.fromDate).startOf('day');
          var end = moment(scope.toDate).endOf('day');

          scope.loadData()(start, end, function(err, ts){
            if(!err) {
              var result = categorizeByDay(ts, start, end);
              scope.graphData = [
                {
                  'key': 'Campaigns',
                  values: result
                }
              ];
            }
          });
        };

        scope.xformat = function(){
          return function(d){
            return d3.time.format('%x')(new Date(d));
          };
        };


        scope.date = {
          fromOpened: false,
          toOpened: false
        };

        scope.openFromDate = function($event) {
          $event.preventDefault();
          $event.stopPropagation();

          scope.date.fromOpened = true;
        };

        scope.openToDate = function($event) {
          $event.preventDefault();
          $event.stopPropagation();

          scope.date.toOpened = true;
        };

        scope.xscale = function() {
          return d3.time.scale();
        };

        scope.tooltipcontent = function() {
          return function(key, x, y, e, graph) {
            var newX = d3.time.format('%Y-%m-%d')(new Date(+e.point[0]));
            return '<p>' + y + ' &#64; ' + newX + '</p>';
          };
        };

        scope.dateOptions = {
          formatYear: 'yy',
          startingDay: 1
        };

        // first time loading data
        $timeout(function() {
          scope.reloadData();
        }, 0);
      }
    };
  }
]);
