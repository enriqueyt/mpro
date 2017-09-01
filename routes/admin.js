var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var Bcrypt = require('bcrypt-nodejs');
var Functional = require('underscore');
var Utils = require('../libs/utils');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoEntity = Mongoose.model('entity');
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

router.get('/admin/:identifier', function(req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var accountPromise = new Promise(function (resolve, reject) {
    var identifier = req.params.identifier || req.user.identifier;
    var role = req.params.role || req.user.role;
    var query = {'identifier': identifier, 'role': role};
    
    mongoAccount.findOne(query).exec()
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
    return res.render('pages/dashboard/dashboard_admin', {
      user : req.user || {},
      //csrfToken: req.csrfToken(),
      currentAccount: data,      
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

router.get('/admin/:identifier/admin-activity-block', function (req, res, next) {
});

router.get('/admin/:identifier/companies', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier found');
    res.redirect('/login');
  }

  if (req.user.role !== 'admin') {
    var message = 'Just for main administrators';
    throw new Error(message);
    return;
  }

  var companiesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'company'};

    mongoEntity.find(query).exec()
    .then(function (companies) {
      resolve(companies.slice());
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var branchCompaniesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'branch_company'};

    mongoEntity.find(query).populate('company').exec()
    .then(function (branchCompanies) {
      resolve(branchCompanies.slice());
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onRender = function (data) {
    return res.render('pages/company/company_admin', {
      user: req.user || {},
      //csrfToken: req.csrfToken()
      companies: data[0],
      branchCompanies: data[1]
    });
  };
    
  Promise.all([companiesPromise, branchCompaniesPromise])
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin/:identifier/users', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  if (req.user.role !== 'admin') {
    throw new Error('Just for main administrators');
    return;
  }

  var populateAccountCompanyPromise = function (account) {
    var promise = new Promise(function (resolve, reject) {
      if (account.role === 'admin_branch_company' || account.role === 'technical') {
        mongoAccount.populate(account, {path: 'company.company', model: 'entity'}, function (err, account) {
          if (err) {
            reject(err);
          }
          else {
            resolve(account);
          }
        });
      }
      else {
        resolve(account);
      }
    });

    return promise;
  };

  var companiesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'company'};

    mongoEntity.find(query).exec()
    .then(function (companies) {
      resolve(companies.slice());
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var accountsPromise = new Promise(function (resolve, reject) {
    var query = {};

    mongoAccount.find(query).populate('company').exec()
    .then(function (users) {
      if (!users || users.length === 0) {
        var message = 'No user found';
        reject(new Error(message));
      }

      var accounts = users;
      var identifier = req.params.identifier || req.user.identifier;
      var currentAccount = Functional.find(accounts, function (account) {
        return account.identifier === identifier;
      });

      accounts.splice(accounts.indexOf(currentAccount), 1);

      var promises = Functional.reduce(accounts, function (accumulator, account) {
        var promise = populateAccountCompanyPromise(account);

        accumulator.push(promise);

        return accumulator;
      }, []);

      Promise.all(promises)
      .then(function (data) {
        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onRender = function (data) {
    return res.render('pages/account/account_admin', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      companies: data[0],
      accounts: data[1],
      roles: mongoAccount.schema.path('role').enumValues
    });
  };

  Promise.all([companiesPromise, accountsPromise])
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin/:identifier/equipments', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  if (req.user.role !== 'admin') {
    throw new Error('Just for main administrators');
    return;
  }

  var populateEquipmentCompanyPromise = function (equipment) {
    var promise = new Promise(function (resolve, reject) {
      mongoEquipment.populate(equipment, {path: 'branchCompany.company', model: 'entity'}, function (err, equipment) {
        if (err) {
          reject(err);
        }
        else {
          resolve(equipment);
        }
      });
    });

    return promise;
  };

  var equipmentTypesPromise = new Promise(function (resolve, reject) {
    var query = {};

    mongoEquipmentType.find(query).populate('company').exec()
    .then(function (equipmentTypes) {
      resolve(equipmentTypes);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var companiesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'company'};

    mongoEntity.find(query).exec()
    .then(function (companies) {
      resolve(companies);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var equipmentsPromise = new Promise(function (resolve, reject) {
    var query = {};

    mongoEquipment.find(query).populate('type').populate('branchCompany').populate('userAssigned').exec()
    .then(function (equipments) {
      var promises = Functional.reduce(equipments, function (accumulator, equipment) {
        var promise = populateEquipmentCompanyPromise(equipment);

        accumulator.push(promise);

        return accumulator;
      }, []);

      Promise.all(promises)
      .then(function (data) {
        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onRender = function (data) {
    return res.render('pages/equipment/equipment_admin', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      equipmentTypes: data[0],
      companies: data[1],
      equipments: data[2]
    });
  };

  Promise.all([equipmentTypesPromise, companiesPromise, equipmentsPromise])
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.post('/entity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var query = {name: req.body.name, email: req.body.email};

  mongoEntity.find(query).exec()
  .then(function (data) {
    if (data.length > 0) {
      return res.json({error: true, message: 'Document already exists'});        
    }

    var document = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,        
      type: req.body.type
    };

    if (typeof req.body.company !== 'undefined') {
      document.company = req.body.company;
    }

    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR:', err);
        return res.json({error: true, message: err});
      }

      return res.json({error: false, data: document});
    };

    var newEntity = new mongoEntity(document);
  
    newEntity.save(onCreateDocument);
  })
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.put('/entity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id' : new ObjectId(req.body._id)};			
  var option = {upsert: true};
		
  var onUpdateDocument = function (err, document) {
    if (err || !document) {
      return res.json({error: true, message: 'Document does not exist'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      document.reAssigned = req.body.name;
    }

    if (typeof req.body.email !== 'undefined') {
      document.email = req.body.email;
    }

    if (typeof req.body.phone !== 'undefined') {
      document.phone = req.body.phone;
    }

    if (typeof req.body.location !== 'undefined') {
      document.location = req.body.location;
    }

    if (typeof req.body.company !== 'undefined') {
      document.company = req.body.company;
    }

    document.save();

    return res.json({error: false, data: document});
  };

  mongoEntity.findOne(query, onUpdateDocument);
});

router.post('/account', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var query = {username: req.body.username};

  mongoAccount.findOne(query).exec()
  .then(function (data) {  
    if (data !== null) {
      return res.json({error: true, message: 'Document already exists'});
    }

    var document = {
      name: req.body.name,
      username: req.body.username,
      password: Utils.createHash(''.concat('mpro-', req.body.username.split('@')[0]), Bcrypt),
      email: req.body.username,
      role: req.body.role,
      company: req.body.branchcompany === '0' ? req.body.company : req.body.branchcompany
    };

    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR:', err);
        return res.json({error: true, message: err});
      }

      return res.json({error: false, data: document});
    };

    var newAccount = new mongoAccount(document);

    newAccount.save(onCreateDocument);
  })
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.put('/account', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id': new ObjectId(req.body._id)};			
  var option = {upsert: true};

  var onUpdateDocument = function (err, document) {
    if (err || !document) {
      return res.json({error: true, message: 'Document does not exist'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      document.reAssigned = req.body.name;
    }

    if (typeof req.body.role !== 'undefined') {
      document.role = req.body.role;
    }

    if (typeof req.body.company !== 'undefined') {
      document.company = req.body.company;
    }

    document.save();

    return res.json({error: false, data: document});
  };
		
  mongoAccount.findOne(query, onUpdateDocument);
});

router.post('/equipmentType', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var query = {name: req.body.name, company: req.body.company};

  mongoEquipmentType.findOne(query).exec()
  .then(function (data) {  
    if (data !== null) {
      return res.json({error: true, message: 'Document already exists'});
    }

    var document = {
      name: req.body.name,
      description: req.body.description,
      company: req.body.company
    };

    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR:', err);
        return res.json({error: true, message: err});
      }

      return res.json({error: false, data: document});
    };

    var newEquipmentType = new mongoEquipmentType(document);

    newEquipmentType.save(onCreateDocument);
  })
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.put('/equipmentType', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id': new ObjectId(req.body._id)};			
  var option = {upsert: true};

  var onUpdateDocument = function (err, document) {
    if (err || !document) {
      return res.json({error: true, message: 'Document does not exist'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      document.name = req.body.name;
    }

    if (typeof req.body.description !== 'undefined') {
      document.description = req.body.description;
    }

    if (typeof req.body.company !== 'undefined') {
      document.company = req.body.company;
    }

    document.save();

    return res.json({error: false, data: document});
  };
		
  mongoEquipmentType.findOne(query, onUpdateDocument);
});

router.post('/equipment', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var query = {code: req.body.code};

  mongoEquipment.findOne(query).exec()
  .then(function (data) {  
    if (data !== null) {
      return res.json({error: true, message: 'Document already exists'});
    }

    var document = {
      name: req.body.name,
      code: req.body.code,
      location: req.body.location,
      branchCompany: req.body.branchCompany,
      type: req.body.type,
      userAssigned: req.body.account
    };

    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR:', err);
        return res.json({error: true, message: err});
      }

      return res.json({error: false, data: document});
    };

    var newEquipment = new mongoEquipment(document);

    newEquipment.save(onCreateDocument);
  })
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.put('/equipment', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'No user found'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id': new ObjectId(req.body._id)};			
  var option = {upsert: true};

  var onUpdateDocument = function (err, document) {
    if (err || !document) {
      return res.json({error: true, message: 'Document does not exist'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      document.name = req.body.name;
    }

    if (typeof req.body.code !== 'undefined') {
      document.code = req.body.code;
    }

    if (typeof req.body.location !== 'undefined') {
      document.location = req.body.location;
    }

    if (typeof req.body.branchCompany !== 'undefined') {
      document.branchCompany = req.body.branchCompany;
    }

    if (typeof req.body.type !== 'undefined') {
      document.type = req.body.type;
    }

    if (typeof req.body.account !== 'undefined') {
      document.userAssigned = req.body.account;
    }

    document.save();

    return res.json({error: false, data: document});
  };
		
  mongoEquipment.findOne(query, onUpdateDocument);
});

module.exports = router;
