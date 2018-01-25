var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var Functional = require('underscore');
var ObjectId = require('mongoose').Types.ObjectId; 

var Utils = require('../libs/utils');

var Activities = require('./profileResources/adminBranchCompany/activities');
var Equipments = require('./profileResources/adminBranchCompany/equipments');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoAccount = Mongoose.model('account');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

var DATE_FORMAT = 'DD/MM/YYYY';

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

router.get('/adminBranchCompany/:identifier', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  var populateAccountCompanyPromise = function (account) {
    var promise = new Promise(function (resolve, reject) {
      mongoAccount.populate(account, {path: 'company.company', model: 'entity'}, function (err, account) {
        if (err) {
          reject(err);
        }
        else {
          resolve(account);
        }
      });
    });

    return promise;
  };

  var accountPromise = new Promise(function (resolve, reject) {
    var identifier = req.params.identifier || req.user.identifier;
    var role = req.params.role || req.user.role;
    var query = {'identifier': identifier, 'role': role};

    mongoAccount.findOne(query).populate('company').exec()
    .then(function (user) {    
      if (!user || user.length === 0) {
        var message = 'No user found';
        reject(new Error(message));
      }
      else {
        var promise = populateAccountCompanyPromise(user);

        promise
        .then(function (account) {
          resolve(account);
        })
        .catch(function (err) {
          reject(err);
        });
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });
  
  var onRender = function (data) {
    return res.render('pages/dashboard/dashboard_admin_branch_company', {
      user: req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount: data      
    });
  };

  accountPromise
  .then(onRender)
  .catch(function (err) {
    console.log('Error:', err);
    res.redirect('/');
    return;
  });
});

router.get('/adminBranchCompany/:identifier/activities', Activities.getActivitiesViewData);

router.get('/adminBranchCompany/:identifier/users', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  var populateAccountCompanyPromise = function (account) {
    var promise = new Promise(function (resolve, reject) {
      mongoAccount.populate(account, {path: 'company.company', model: 'entity'}, function (err, account) {
        if (err) {
          reject(err);
        }
        else {
          resolve(account);
        }
      });
    });

    return promise;
  };

  var accountPromise = new Promise(function (resolve, reject) {
    var identifier = req.params.identifier || req.user.identifier;
    var role = req.params.role || req.user.role;
    var query = {'identifier': identifier, 'role': role};
  
    mongoAccount.findOne(query).populate('company').exec()
    .then(function (user) {
      if (!user || user.length == 0) {
        var message = 'No user found';
        reject(new Error(message));
      }
      else {
        var promise = populateAccountCompanyPromise(user);

        promise
        .then(function (account) {
          resolve(account);
        })
        .catch(function (err) {
          reject(err);
        });
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchAccounts = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {role: 'technician', company: new ObjectId(user.company._id)};

      mongoAccount.find(query).populate('company').lean().exec()
      .then(function (accounts) {
        accounts = Functional.map(accounts, function (account) {
          account.date = Utils.formatDate(account.date, DATE_FORMAT);
          account.roleValue = mongoAccount.getRoleValue(account.role);
          return account;
        });

        resolve([user, accounts]);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  };

  var onRender = function (data) {
    var roleEnumValues = mongoAccount.schema.path('role').enumValues;
    var roles = Functional.filter(roleEnumValues, function (roleEnumValue) {
      return roleEnumValue !== 'admin' && roleEnumValue !== 'adminCompany' && roleEnumValue !== 'adminBranchCompany';
    });

    return res.render('pages/account/account_admin_branch_company', {
      user: req.user || {},
      currentAccount: data[0],
      accounts: data[1],
      roles: roles
    });
  };
  
  accountPromise
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/adminBranchCompany/:identifier/equipments', Equipments.getEquipmentsViewData);

module.exports = router;
