'use strict';

/**
 * Module dependencies.
 */
var qs = require('querystring'),
    authom = require('authom'),
    async = require('async'),
    users = require('./users'),
    oauth2model = require('./oauth2model.server.controller.js'),
    config = require('../../config/config');

authom.createServer({
  service: 'stripe',
  id: config.stripe.clientID,
  secret: config.stripe.clientSecret
});

authom.createServer({
  service: 'facebook',
  id: config.facebook.clientID,
  secret: config.facebook.clientSecret,
  scope: ['email']
});

authom.createServer({
  service: 'google',
  id: config.google.clientID,
  secret: config.google.clientSecret,
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
});

var redirectTo = function(req, res, redirectUrl) {
  var protocol = req.url.protocol;
  var baseUrl = protocol + '//' + req.url.host;
  var url = baseUrl + redirectUrl;
  res.writeHead(302, {Location: url});
  res.end();
};

authom.on('auth', function(req, res, data) {
  var code = req.query.code;
  async.waterfall([
    function(callback) {
      users.saveOAuthUserProfile(req, data, function(err, user) {
        callback(err, user);
      });
    },
    function(user, callback) {
      var expires = new Date();
      var seconds = expires.getSeconds() + 30;
      expires.setSeconds(seconds);
      oauth2model.saveAuthCode(code, 'mootee', expires, user, function(err, user) {
        callback(err, user);
      });
    }
  ], function(err) {
    var url, params;
    if (err) {
      params = qs.stringify({
        error: err.name,
        error_description: err.message
      });
      url =  '/#!/auth/error?' + params;
      redirectTo(req, res, url);
    } else {
      params = qs.stringify({
        code: code
      });
      url = '/#!/auth/token?' + params;
      redirectTo(req, res, url);
    }
  });
});

authom.on('error', function(req, res, data) {
  var params = qs.stringify(data);
  var url = '/#!/auth/error?' + params;
  redirectTo(req, res, url);
});

exports.authom = authom;
