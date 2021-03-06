'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    async = require('async'),
    moment = require('moment'),
    config = require('../../../config/config'),
    sinon = require('sinon'),
    mongodb = require('mongodb'),
    mongoose = require('mongoose'),
    Agenda = require('agenda'),
    proxyquire = require('proxyquire'),
    _ = require('lodash'),
    Order = mongoose.model('Order'),
    User = mongoose.model('User'),
    Img = mongoose.model('Image'),
    Campaign = mongoose.model('Campaign'),
    Tshirt = mongoose.model('Campaign');

/**
 * Globals
 */
var user, campaign, order;
var agendaTestJobCollection = 'agendaTestJobs';
var testCaseTimeout = 15 * 1000; // seconds
var campaignJobTimeout = 10 * 1000; // seconds

var testAgenda = new Agenda(
  {
    db: {
      address: config.db,
      collection: agendaTestJobCollection
    }
  }
);

var frontImg = new Img({
  url: '0.0.0.0/from_image.jpg',
  user: user
});

var backImg = new Img({
  url: '0.0.0.0/back_image.jpg',
  user: user
});

var tshirt = new Tshirt({
  name: 'Tshirt Name',
  user: user,
  variants:
  [
    {
      name: 'Variant Name',
      description: 'Description',
      baseCost: 10,
      currency: 'SEK',
      colors: ['00000', 'ffffff']
    }
  ],
  frontImage: frontImg,
  backImage: backImg
});

function removeAgendaJobs(callback) {
  mongodb.MongoClient.connect(config.db, function(err, db) {
    if(!err) {
      db.collection(agendaTestJobCollection, function(err, collection) {
        collection.remove({}, {w:1}, function(err, result) {
          if(!err) {
            console.log('removed all data in agenda jobs.');
          }

          callback(err);
        });
      });
    }
  });
}

function createUserFun(username, password) {
  return function(callback) {
    User.create(
      {
        username: username,
        password: password,
        provider: 'local'
      },
      function(err, user) {
        callback(err, user);
      }
    );
  };
}

function createCampaignFun(name, created, ended, description,
                           goal, price, state) {
  return function(user, callback) {
    Campaign.create(
      {
        name: name,
        user: user,
        created: created,
        ended: ended,
        description: description,
        length: 7, // not important
        goal: goal,
        color: 'white',
        tshirt: tshirt,
        tshirtRef: tshirt._id,
        price: {
          value: price,
          currency: 'SEK'
        },
        design: 'nice design',
        state: state
      },
      function(err, campaign) {
        callback(err, campaign);
      }
    );
  };
}

function createOrderFun(description, quantity, campaign) {
  return function(callback) {
    var randomStr = Math.random().toString(36).substring(7);

    Order.create(
      {
        provider: 'stripe',
        user: user,
        campaign: campaign,
        description: description,
        email: 'user@example.com',
        amount: campaign.price.value,
        quantity: quantity,
        currency: campaign.price.currency,
        shippingAddr: {
          name: 'username',
          street: 'street',
          roomNum: 'room number',
          city: 'city',
          zipcode: '12345',
          country: 'Sweden'
        },
        payment: {
          customerId: randomStr
        }
      },
      function(err, order) {
        callback(err, order);
      }
    );
  };
}

function createOrdersFun(numOfOrders) {
  return function(campaign, callback) {
    var funcs = _.chain(
      _.range(1, numOfOrders+1)
    ).map(
      function(index) {
        return { description: 'nice order ' + index, quantity: 1};
      }
    ).map(
      function(spec) {
        return createOrderFun(spec.description, spec.quantity, campaign);
      }
    ).value();

    async.parallel(
      funcs,
      function(err, orders) {
        if(err) {
          console.log('order err:');
          console.log(err);
        }

        _.each(orders, function(order) {
          console.log('Order [' + order._id + '] is created.');
        });

        callback(err, campaign, orders);
      }
    );
  };
}

function provisionCampaignsAndOrders(startDate, endDate, goal, state,
                                     numOfOrders, callback) {
  async.waterfall(
    [
      removeAgendaJobs,
      createUserFun('admin@mootee.io', 'password'),
      createCampaignFun('nice campaign', startDate, endDate,
                        'description', goal, 50, state),
      createOrdersFun(numOfOrders)
    ],
    callback
  );
}

function cleanupCampaignsAndOrders(callback) {
  Order.remove().exec();
  Campaign.remove().exec();
  User.remove().exec();
  removeAgendaJobs(callback);
}

var chargeCount = 0;
var deleteCount = 0;
var stripeStub = function() {
      return {
        charges: {
          create: function(obj, callback) {
            chargeCount++;
            callback(null, 'charged');
          }
        },
        customers: {
          del: function(customerId, callback) {
            deleteCount++;
            callback(null, customerId);
          }
        }
      };
    },
    campaignJob = proxyquire(
      '../../lib/jobs/campaign.server.job',
      {
        'stripe': stripeStub
      }
    );

var configStub = {
  stripe: {
    clientSecret: 'stripeClientSecret'
  },
  job: {
    campaignJob: {
      frequency: '1 day'
    }
  }
};

describe('Campaign not tipped, endedDate has passed.', function() {
  this.timeout(testCaseTimeout);

  describe('Have enough orders', function() {
    var nowMoment = moment(new Date()),
        createdMoment = nowMoment.clone().add(-7, 'days'),
        endedMoment = createdMoment.clone().add(5, 'days'),
        campaignGoal = 10,
        numOfOrders = 10,
        campaign;

    before(function(done) {
      provisionCampaignsAndOrders(
        createdMoment.toDate(),
        endedMoment.toDate(),
        campaignGoal,
        'not_tipped',
        numOfOrders,
        function(err, campn, orders) {
          campaign = campn;
          should.not.exist(err);
          done();
        }
      );
    });

    it('should charge user and delete customers', function(done) {
      chargeCount = 0;
      deleteCount = 0;
      // execute campaignJob
      campaignJob(testAgenda, configStub);
      testAgenda.start();

      setTimeout(function() {
        Campaign.findById(campaign._id).exec(function(err, campaign) {
          should.not.exist(err);

          (campaign.state).should.be.equal('tipped');

          (chargeCount).should.be.equal(numOfOrders);
          (deleteCount).should.be.equal(numOfOrders);
          done();
        });
      }, campaignJobTimeout);
    });

    after(function(done) {
      testAgenda.stop();
      cleanupCampaignsAndOrders(function(err) {
        if(err) {
          console.log('cleanup campaign and orders failed:');
          console.log(err);
        }
        done();
      });
    });
  });

  describe('Do not have enough orders', function() {
    var nowMoment = moment(new Date()),
        createdMoment = nowMoment.clone().add(-7, 'days'),
        endedMoment = createdMoment.clone().add(5, 'days'),
        campaignGoal = 10,
        numOfOrders = 8,
        state = 'not_tipped',
        campaign;

    before(function(done) {
      provisionCampaignsAndOrders(
        createdMoment.toDate(),
        endedMoment.toDate(),
        campaignGoal,
        'not_tipped',
        numOfOrders,
        function(err, campn, orders) {
          campaign = campn;
          should.not.exist(err);
          done();
        }
      );
    });

    it('should not charge user, but should delete customers', function(done) {
      chargeCount = 0;
      deleteCount = 0;
      // execute campaignJob
      campaignJob(testAgenda, configStub);
      testAgenda.start();

      setTimeout(function() {
        Campaign.findById(campaign._id).exec(function(err, campaign) {
          should.not.exist(err);

          (campaign.state).should.be.equal('expired');

          (chargeCount).should.be.equal(0);
          (deleteCount).should.be.equal(numOfOrders);
          done();
        });
      }, campaignJobTimeout);
    });

    after(function(done) {
      testAgenda.stop();

      cleanupCampaignsAndOrders(function(err) {
        if(err) {
          console.log('cleanup campaign and orders failed:');
          console.log(err);
        }
        done();
      });
    });
  });

});

describe('Campaign not tipped, endedDate has not passed.', function() {
  this.timeout(testCaseTimeout);

  describe('Have enough orders', function() {
    var nowMoment = moment(new Date()),
        createdMoment = nowMoment.clone().add(-7, 'days'),
        endedMoment = createdMoment.clone().add(8, 'days'),
        campaignGoal = 10,
        numOfOrders = 10,
        campaign;

    before(function(done) {
      provisionCampaignsAndOrders(
        createdMoment.toDate(),
        endedMoment.toDate(),
        campaignGoal,
        'not_tipped',
        numOfOrders,
        function(err, campn, orders) {
          campaign = campn;
          should.not.exist(err);
          done();
        }
      );
    });

    it('should not charge user and should not delete customers', function(done) {
      chargeCount = 0;
      deleteCount = 0;
      // execute campaignJob
      campaignJob(testAgenda, configStub);
      testAgenda.start();

      setTimeout(function() {
        Campaign.findById(campaign._id).exec(function(err, campaign) {
          should.not.exist(err);

          (campaign.state).should.be.equal('not_tipped');

          (chargeCount).should.be.equal(0);
          (deleteCount).should.be.equal(0);
          done();
        });
      }, campaignJobTimeout);
    });

    after(function(done) {
      testAgenda.stop();
      cleanupCampaignsAndOrders(function(err) {
        if(err) {
          console.log('cleanup campaign and orders failed:');
          console.log(err);
        }
        done();
      });
    });
  });
});
