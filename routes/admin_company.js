var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var ObjectId = require('mongoose').Types.ObjectId; 
var Functional = require('underscore');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoAccount = Mongoose.model('account');
var mongoEntity = Mongoose.model('entity');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

var sessionHandle = require('../libs/sessionHandle');
var Log = require('../libs/log');

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

router.get('/admin_company', sessionHandle.isLoogged, function (req, res, next) {
  if (!req.user) {
    console.log('No identifier');
    res.redirect('/login');
  }

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
        resolve(user);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onRender = function (data) {
    var tempuser = req.user;
    req.user={};
    return res.render('pages/dashboard/dashboard_admin_company', {
      user: tempuser || {},
      //csrfToken: req.csrfToken(),
      currentAccount: data   
    });
  };

  accountPromise
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin_company/companies', sessionHandle.isLoogged, function (req, res, next) {
  if (!req.user) {
    console.log('No identifier');
    res.redirect('/login');
  }

  if (req.user.role !== 'admin_company') {
    var message = 'Just for main administrators';
    throw new Error(message);
    return;
  }

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
        resolve(user);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchBranchCompanies = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {type: 'branch_company', company: new ObjectId(user.company._id)};

      mongoEntity.find(query).exec()
      .then(function (branchCompanies) {
        resolve([user, branchCompanies.slice()]);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  };

  var onRender = function (data) {
    var tempuser = req.user||{};
    req.user={};
    return res.render('pages/company/company_admin_company', {
      user: tempuser,
      //csrfToken: req.csrfToken()
      currentAccount: data[0],
      branchCompanies: data[1]
    });
  };

  accountPromise
  .then(onFetchBranchCompanies)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin_company/users', sessionHandle.isLoogged, function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

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
        resolve(user);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });
  
  var onFetchBranchCompanies = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {type: 'branch_company', company: new ObjectId(user.company._id)} 
    
      mongoEntity.find(query).exec()
      .then(function (branchCompanies) {
        resolve([user, branchCompanies.slice()]);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  };

  var onFetchAccounts = function (data) {
    var branchCompanyIds = Functional.reduce(data[1], function(accumulator, branchCompany) {
      accumulator.push(branchCompany._id);

      return accumulator;
    }, []);     

    var promise = new Promise(function (resolve, reject) {
      var query = {company: {$in: branchCompanyIds}};

      mongoAccount.find(query).populate('company').exec()
      .then(function (accounts) {
        data.push(accounts);
        resolve(data);
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
      return roleEnumValue !== 'admin' && roleEnumValue !== 'admin_company';
    });

    var tempuser = req.user||{};
    req.user={};

    return res.render('pages/account/account_admin_company', {
      user: tempuser,
      currentAccount: data[0],
      branchCompanies: data[1],
      accounts: data[2],
      roles: roles
    });
  };

  accountPromise
  .then(onFetchBranchCompanies)
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin_company/equipments', sessionHandle.isLoogged, function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

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
        resolve(user);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchEquipmentTypes = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {company: new ObjectId(user.company._id)};

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

  var onFetchBranchCompanies = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {type: 'branch_company', company: new ObjectId(data[0].company._id)} 
    
      mongoEntity.find(query).exec()
      .then(function (branchCompanies) {
        data.push(branchCompanies);
        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  };

  var onFetchEquipments = function (data) {
    var branchCompanyIds = Functional.reduce(data[2], function(accumulator, branchCompany) {
      accumulator.push(branchCompany._id);

      return accumulator;
    }, []);

    var promise = new Promise(function (resolve, reject) {
      var query = {branchCompany: {$in: branchCompanyIds}};

      mongoEquipment.find(query).populate('type').populate('branchCompany').populate('userAssigned').exec()
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

  var onRender = function (data) {
    var tempuser = req.user||{};
    req.user={};
    return res.render('pages/equipment/equipment_admin_company', {
      user : tempuser,
      currentAccount: data[0],
      equipmentTypes: data[1],
      branchCompanies: data[2],
      equipments: data[3]
    });
  };

  accountPromise
  .then(onFetchEquipmentTypes)
  .then(onFetchBranchCompanies)
  .then(onFetchEquipments)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

module.exports = router;
