var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var Functional = require('underscore');
var ObjectId = require('mongoose').Types.ObjectId; 

var Activities = require('./adminBranchCompany/activities');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoAccount = Mongoose.model('account');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

router.get('/admin_branch_company/:identifier', function (req, res, next) {
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

router.get('/admin_branch_company/:identifier/activities', Activities.getActivities);

router.get('/admin_branch_company/:identifier/users', function (req, res, next) {
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

      mongoAccount.find(query).populate('company').exec()
      .then(function (accounts) {
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
      return roleEnumValue !== 'admin' && roleEnumValue !== 'admin_company' && roleEnumValue !== 'admin_branch_company';
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

router.get('/admin_branch_company/:identifier/equipments', function (req, res, next) {
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

  var onFetchEquipmentTypes = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {company: new ObjectId(user.company.company._id)};

      mongoEquipmentType.find(query).exec()
      .then(function (equipmentTypes) {
        resolve([user, equipmentTypes]);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  };

  var onFetchEquipments = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {branchCompany: new ObjectId(data[0].company._id)};

      mongoEquipment.find(query).populate('equipmentType').populate('userAssigned').exec()
      .then(function (equipments) {
        data.push(equipments);
        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    });
    
    return promise;
  };

  var onFetchAccounts = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {role: 'technician', company: new ObjectId(data[0].company._id)};

      mongoAccount.find(query).exec()
      .then(function (accounts) {
        data.push(accounts);
        resolve(data);
      })
      .then(function (err) {
        reject(err);
      });
    });

    return promise;
  }

  var onRender = function (data) {
    return res.render('pages/equipment/equipment_admin_branch_company', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount: data[0],
      equipmentTypes: data[1],
      equipments: data[2],
      accounts: data[3]
    });
  };

  accountPromise
  .then(onFetchEquipmentTypes)
  .then(onFetchEquipments)
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

module.exports = router;
