'use strict';

/* global emit */

/**
 * Module dependencies.
 */
var moment = require('moment'),
    _ = require('lodash'),
    logger = require('../lib/logger.server.lib.js'),
    mongoose = require('mongoose'),
    Campaign = mongoose.model('Campaign'),
    Order = mongoose.model('Order');

/**
 * Show total income.
 */
exports.readTotalIncome = function(req, res) {
  // Find orders that it's campaign owned by current user
  Campaign.find({user: req.user._id, state: 'tipped'}).select('_id')
    .exec(function(err, campaigns) {
    if(err || !campaigns.length) {
      if(err) {
        logger.error('Failed to read total income: ' + err);
      }
      res.jsonp({
        value: 0
      });
    } else {
      var options = {};
      options.map = function () {
        emit(this.campaign, this.amount);
      };
      options.reduce = function (key, values) {
        return Array.sum(values);
      };
      var getId = function(o) { return o._id; };
      options.query = {campaign: {$in: campaigns.map(getId)}};

      Order.count(options.query, function(err, count) {
        if(err || !count) {
          if(err) {
            logger.error('Failed to read total income: ' + err);
          }
          res.jsonp({
            value: 0
          });
        }
        else {
          Order.mapReduce(options, function(err, results) {
            if(err || !results.length) {
              if(err) {
                logger.error('Failed to read total income: ' + err);
              }
              res.jsonp({
                value: 0
              });
            } else {
              var value = results.reduce(function(p, c, i, a) {
                c = p + a[i].value;
                return c;
              }, 0);
              res.jsonp({
                value: value
              });
            }
          });
        }
      });
    }
  });
};

/**
 * Show total orders.
 */
exports.readTotalOrders = function(req, res) {
  Order.find({user: req.user._id}).count(function (err, count) {
    if(err || !count) {
      if(err) {
        logger.error('Failed to read total orders: ' + err);
      }
      res.jsonp({
        value: 0
      });
    }
    else {
      res.jsonp({
        value: count
      });
    }
  });
};

/**
 * Show total campaigns.
 */
exports.readTotalCampaigns = function(req, res) {
  Campaign.find({user: req.user._id}).count(function (err, count) {
    if(err || !count) {
      if(err) {
        logger.error('Failed to read total campaigns: ' + err);
      }
      res.jsonp({
        value: 0
      });
    }
    else {
      res.jsonp({
        value: count
      });
    }
  });
};

/**
 * Show active campaigns.
 */
exports.readActiveCampaigns = function(req, res) {
  Campaign.find({user: req.user._id, state: {$ne: 'expired'}})
    .count(function (err, count) {
    if(err || !count) {
      if(err) {
        logger.error('Failed to read active campaigns: ' + err);
      }
      res.jsonp({
        value: 0
      });
    }
    else {
      res.jsonp({
        value: count
      });
    }
  });
};

var timeSeriesGenerator = function(model, query, sumBy) {
  return function(req, res) {
    var startDate = new Date(req.query.startDate),
        endDate = new Date(req.query.endDate),
        timezoneOffset = +req.query.offset,
        // convert timezone offset from minute to millisecond
        offset = timezoneOffset * 60 * 1000;
    var _query = {
      user: req.user._id,
      created: {
        $gte: startDate,
        $lte: endDate
      }
    };
    _query = _.extend(_query, query);
    var stages = {};
    stages.$match = {
      $match: _query
    };
    stages.$projectOffset ={
      $project: {
        created_offset: {$subtract: ['$created', offset]}
      }
    };
    stages.$project ={
      $project: {
        year: {$year: '$created_offset'},
        month: {$month: '$created_offset'},
        day: {$dayOfMonth: '$created_offset'}
      }
    };
    stages.$group = {
      $group: {
        _id: {year: '$year', month: '$month', day: '$day'},
        _value: {
          $sum: 1
        }
      }
    };
    if(sumBy) {
      stages.$projectOffset.$project[sumBy] = 1;
      stages.$project.$project[sumBy] = 1;
      stages.$group.$group._value.$sum = '$' + sumBy;
    }
    stages.$sort = {
      $sort: {
        _id: 1
      }
    };

    var getTime = function(_id) {
      return moment.utc([_id.year, _id.month, _id.day].join('-'))
        .toDate().getTime() + offset;
    };

    model.count(query, function(err, count) {
      if(err || !count) {
        if(err) {
          logger.error('Failed to generate time series data: ' + err);
        }
        res.jsonp({
          total: 0,
          values: []
        });
      }
      else {
        model.aggregate(
          stages.$match,
          stages.$projectOffset,
          stages.$project,
          stages.$group,
          stages.$sort,
          function(err, results) {
            if(err || !results.length) {
              if(err) {
                logger.error('Failed to generate time series data: ' + err);
              }
              res.jsonp({
                total: 0,
                values: []
              });
            } else {
              var values = results.map(function(r) {
                return [getTime(r._id), r._value];
              });
              var total = values.reduce(function (p, c, i, a) {
                c = p + a[i][1];
                return c;
              }, 0);
              res.jsonp({
                total: total,
                values: values
              });
            }
          }
        );
      }
    });
  };
};

/**
 * Show income created.
 */
exports.readIncomeCreated = function(req, res) {
  Campaign.find({user: req.user._id, state: 'tipped'}).select('_id')
    .exec(function(err, campaigns) {
    if(err || !campaigns.length) {
      if(err) {
        logger.error('Failed to read income created: ' + err);
      }
      res.jsonp({
        total: 0,
        values: []
      });
    } else {
      var getId = function(o) { return o._id; };
      var query = {campaign: {$in: campaigns.map(getId)}};
      timeSeriesGenerator(Order, query, 'amount')(req, res);
    }
  });
};

/**
 * Show campaigns created.
 */
exports.readCampaignsCreated = timeSeriesGenerator(Campaign);

/**
 * Show orders created.
 */
exports.readOrdersCreated = timeSeriesGenerator(Order);
