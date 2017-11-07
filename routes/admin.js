var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var Bcrypt = require('bcrypt-nodejs');
var Functional = require('underscore');
var Utils = require('../libs/utils');

var Activities = require('./admin/activities');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoEntity = Mongoose.model('entity');
var mongoAccount = Mongoose.model('account');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');
var mongoMaintenanceActivity = Mongoose.model('maintenanceActivity');
var mongoMaintenanceActivityAttention = Mongoose.model('maintenanceActivityAttention');

var DATE_FORMAT = 'DD/MM/YYYY';

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

router.get('/admin/:identifier', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier found');
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

router.get('/admin/:identifier/activities', Activities.getActivities);

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
    var query = {type: 'branchCompany'};

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
    var message = 'Just for main administrators';
    throw new Error(message);
    return;
  }

  var populateAccountCompanyPromise = function (account) {
    var promise = new Promise(function (resolve, reject) {
      if (account.role === 'adminBranchCompany' || account.role === 'technician') {
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

    mongoAccount.find(query).populate('company').lean().exec()
    .then(function (users) {
      if (!users || users.length === 0) {
        var message = 'No user found';
        reject(new Error(message));
      }

      var accounts = Functional.map(users, function (user) {
        user.date = Utils.formatDate(user.date, DATE_FORMAT);
        user.roleValue = mongoAccount.getRoleValue(user.role);
        return user;
      });

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
      roles: mongoAccount.getRoleValues()
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

    mongoEquipment.find(query).populate('equipmentType').populate('branchCompany').populate('userAssigned').exec()
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

router.post('/maintenanceActivities', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var maintenanceActivities = JSON.parse(req.body.documents);

  var saveMaintenanceActivityPromise = function (maintenanceActivity) {
    var promise = new Promise(function (resolve, reject) {
      var onCreateDocument = function (err, document) {        
        if (err) {
          console.log('ERROR on Create:', err.message);
          resolve({error: true, message: err.message});
        };
  
        resolve({error: false, data: document});
      };
  
      var newMaintenanceActivity = new mongoMaintenanceActivity(maintenanceActivity);
    
      newMaintenanceActivity.save(onCreateDocument);
    });

    return promise;
  };

  var rollBackPromise = function (maintenanceActivity) {
    var promise = new Promise(function (resolve, reject) {
      var onRemoveDocument = function (err, document) {
        if (err) {
          console.log('ERROR on RollBack:', err.message);
          reject({error: true, message: err.message});
        };
  
        resolve({error: false, data: document});
      };
      
      // console.log("ROLLBACK Document ID: ", maintenanceActivity._id);
      mongoMaintenanceActivity.findByIdAndRemove(maintenanceActivity._id, onRemoveDocument);
    });

    return promise;
  };

  var createDocumentPromises = Functional.reduce(maintenanceActivities, function (accumulator, maintenanceActivity) {
    var promise = saveMaintenanceActivityPromise(maintenanceActivity);
    accumulator.push(promise);
    return accumulator;
  }, []);

  var onCreateDocuments = function (results) {
    var errors = Functional.filter(results, function (result) {
      return result.error === true;
    });

    if (errors.length > 0) {
      var bulkTrace = Functional.reduce(results, function (accumulator, result) {
        accumulator.push(result.error);
        return accumulator;
      }, []);

      var rollBackPromises = Functional.reduce(results, function (accumulator, result) {
        if (result.error === false) {
          // console.log('DOCUMENT CREATED: ', result.data);
          var promise = rollBackPromise(result.data);
          accumulator.push(promise);    
        }

        return accumulator;
      }, []);

      Promise.all(rollBackPromises)
      .then(function (data) {
        // console.log('ROLLBACK: ', data);
      });

      res.status(412).send({error: true, message: errors, results: bulkTrace});
    }
    else {
      var documents = Functional.reduce(results, function (accumulator, result) {
        accumulator.push(result.data);
        return accumulator;
      }, []);

      res.status(200).send(documents);
    }
  }

  Promise.all(createDocumentPromises)
  .then(onCreateDocuments)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(500).send(err.message);
  });
});

router.get('/maintenanceActivities/:maintenanceActivity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.maintenanceActivity};

  mongoMaintenanceActivity.findOne(query).populate('company').populate('equipmentType').exec()
  .then(function (document) {
    res.status(200).send({error: false, data: document});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
});

router.put('/maintenanceActivities/:maintenanceActivity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.maintenanceActivity};			
  var option = {new: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    setValues.name = req.body.name;
  }

  if (typeof req.body.description !== 'undefined') {
    setValues.description = req.body.description;
  }

  if (typeof req.body.status !== 'undefined') {
    setValues.status = req.body.status;
  }

  if (typeof req.body.deleted !== 'undefined') {
    setValues.deleted = req.body.deleted;
  }

  var onUpdateDocument = function (err, document) {
    if (err) {
      res.status(500).send({error: true, message: 'Unexpected error was occurred'});
    }
    
    if (!document) {
      res.status(404).send({error: true, message: 'Document does not exist'});
    }

    res.status(200).send({error: false, data: document});
  };

  mongoMaintenanceActivity.findOneAndUpdate(query, {$set: setValues}, option, onUpdateDocument);
});

router.post('/maintenanceActivityAttentions', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var documents = JSON.parse(req.body.documents);
  var maintenanceActivityDates = [];

  var maintenanceActivityAttentions = Functional.reduce(documents, function (accumulator, document) {
    var identifier = Utils.createUniqueId();
    var maintenanceActivityDate = {date: new Date(document.date), identifier: identifier};
    
    maintenanceActivityDates.push(maintenanceActivityDate);

    accumulator = Functional.reduce(document.maintenanceActivityAttentions, function (accumulator, maintenanceActivityAttention) {
      maintenanceActivityAttention['identifier'] = identifier;
      maintenanceActivityAttention['date'] = new Date(maintenanceActivityAttention.date);
      accumulator.push(maintenanceActivityAttention);
      return accumulator;
    }, accumulator);
    
    return accumulator;
  }, []);

  var saveMaintenanceActivityAttentionPromise = function (maintenanceActivityAttention) {
    var promise = new Promise(function (resolve, reject) {
      var onCreateDocument = function (err, document) {        
        if (err) {
          console.log('ERROR on Create:', err.message);
          resolve({error: true, code: 500, message: err.message});
        };
  
        resolve({error: false, data: document});
      };
  
      var newMaintenanceActivityAttention = new mongoMaintenanceActivityAttention(maintenanceActivityAttention);
    
      newMaintenanceActivityAttention.save(onCreateDocument);
    });

    return promise;
  };

  var rollBackPromise = function (maintenanceActivityAttention) {
    var promise = new Promise(function (resolve, reject) {
      var onRemoveDocument = function (err, document) {
        if (err) {
          console.log('ERROR on RollBack:', err.message);
          reject({error: true, code: 500, message: err.message});
        };
  
        resolve({error: false, data: document});
      };
      
      // console.log("ROLLBACK Document ID: ", maintenanceActivityAttention._id);
      mongoMaintenanceActivityAttention.findByIdAndRemove(maintenanceActivityAttention._id, onRemoveDocument);
    });

    return promise;
  };

  var createDocumentPromises = Functional.reduce(maintenanceActivityAttentions, function (accumulator, maintenanceActivityAttention) {
    var promise = saveMaintenanceActivityAttentionPromise(maintenanceActivityAttention);
    accumulator.push(promise);
    return accumulator;
  }, []);

  var onCreateDocuments = function (results) {
    var promise = new Promise(function (resolve, reject) {
      var errors = Functional.filter(results, function (result) {
        return result.error === true;
      });
  
      if (errors.length > 0) {
        var bulkTrace = Functional.reduce(results, function (accumulator, result) {
          accumulator.push(result.error);
          return accumulator;
        }, []);
  
        var rollBackPromises = Functional.reduce(results, function (accumulator, result) {
          if (result.error === false) {
            // console.log('DOCUMENT CREATED: ', result.data);
            var promise = rollBackPromise(result.data);
            accumulator.push(promise);    
          }
  
          return accumulator;
        }, []);
  
        Promise.all(rollBackPromises)
        .then(function (data) {
          // console.log('ROLLBACK: ', data);
        });
  
        reject({error: true, code: 412, message: errors, results: bulkTrace});
      }
      else {
        var documents = Functional.reduce(results, function (accumulator, result) {
          accumulator.push(result.data);
          return accumulator;
        }, []);

        resolve([documents, maintenanceActivityDates]);
      }
    });

    return promise;   
  }

  var onUpdateEquipment = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {'_id': req.body.equipment};
      var options = {new: true, upsert: true};
      var maintenanceActivityAttentions = data[0];
      var maintenanceActivityDates = data[1];
    
      var onUpdateDocument = function (err, document) {
        if (err || !document) {
          var rollBackPromises = Functional.reduce(maintenanceActivityAttentions, function (accumulator, maintenanceActivityAttention) {
            var promise = rollBackPromise(maintenanceActivityAttention);
            accumulator.push(promise);

            return accumulator;
          }, []);

          Promise.all(rollBackPromises)
          .then(function (data) {
            // console.log('ROLLBACK: ', data);
          });

          if (err) {
            reject({error: true, code: 500, message: 'Unexpected error was occurred'});
          }

          if (!document) {
            reject({error: true, code: 404, message: 'Equipment document does not exist'});
          }
        }
        else {
          resolve({error: false, data: maintenanceActivityAttentions});
        }
      };
    
      mongoEquipment.findOneAndUpdate(query, {$push: {maintenanceActivityDates: {$each: maintenanceActivityDates}}}, options, onUpdateDocument);
    });

    return promise;
  };

  var onFinish = function (data) {
    res.status(200).send(data);
  }

  Promise.all(createDocumentPromises)
  .then(onCreateDocuments)
  .then(onUpdateEquipment)
  .then(onFinish)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(err.code).send(err.message);
  });
});

router.post('/entities', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveEntityPromise = new Promise(function (resolve, reject) {
    var entity = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,        
      type: req.body.type
    };
  
    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR on Create:', err.message);
        reject({error: true, code: 500, message: err.message});
      };

      resolve({error: false, data: document});
    };
  
    var newEntity = new mongoEntity(entity);

    newEntity.save(onCreateDocument);
  });

  var onFinish = function (data) {
    res.status(200).send(data);
  };

  saveAccountPromise
  .then(onFinish)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(err.code).send(err.message);
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

router.post('/accounts', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveAccountPromise = new Promise(function (resolve, reject) {
    var account = {
      name: req.body.name,
      username: req.body.username,
      password: Utils.createHash(''.concat('mpro-', req.body.username.split('@')[0]), Bcrypt),
      email: req.body.username,
      role: req.body.role,
      status: req.body.status,
      company: req.body.branchCompany === undefined ? req.body.company : req.body.branchCompany
    };
  
    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR on Create:', err.message);
        reject({error: true, code: 500, message: err.message});
      };

      resolve({error: false, data: document});
    };
  
    var newAccount = new mongoAccount(account);

    newAccount.save(onCreateDocument);
  });

  var onFinish = function (data) {
    res.status(200).send(data);
  };

  saveAccountPromise
  .then(onFinish)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(err.code).send(err.message);
  });
});

// TODO: Update
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

router.post('/equipmentTypes', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveEquipmentTypePromise = new Promise(function (resolve, reject) {
    var equipmentType = {
      name: req.body.name,
      description: req.body.description,
      company: req.body.company
    };
  
    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR on Create:', err.message);
        reject({error: true, code: 500, message: err.message});
      };

      resolve({error: false, data: document});
    };
  
    var newEquipmentType = new mongoEquipmentType(equipmentType);

    newEquipmentType.save(onCreateDocument);
  });

  var onFinish = function (data) {
    res.status(200).send(data);
  };

  saveEquipmentTypePromise
  .then(onFinish)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(err.code).send(err.message);
  });
});

router.get('/equipmentTypes/:equipmentType', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.equipmentType};

  mongoEquipmentType.findOne(query).populate('company').exec()
  .then(function (document) {
    res.status(200).send({error: false, data: document});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
});

router.put('/equipmentTypes/:equipmentType', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.body.equipmentType};			
  var option = {upsert: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    setValues.name = req.body.name;
  }

  if (typeof req.body.description !== 'undefined') {
    setValues.description = req.body.description;
  }

  if (typeof req.body.company !== 'undefined') {
    setValues.company = req.body.company;
  }

  if (typeof req.body.status !== 'undefined') {
    setValues.status = req.body.status;
  }

  if (typeof req.body.deleted !== 'undefined') {
    setValues.deleted = req.body.deleted;
  }

  var onUpdateDocument = function (err, document) {
    if (err) {
      res.status(500).send({error: true, message: 'Unexpected error was occurred'});
    }
    
    if (!document) {
      res.status(404).send({error: true, message: 'Document does not exist'});
    }

    res.status(200).send({error: false, data: document});
  };

  mongoEquipmentType.findOneAndUpdate(query, {$set: setValues}, option, onUpdateDocument);
});

router.post('/equipments', function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveEquipmentPromise = new Promise(function (resolve, reject) {
    var equipment = {
      name: req.body.name,
      code: req.body.code,
      location: req.body.location,
      branchCompany: req.body.branchCompany,
      equipmentType: req.body.equipmentType,
      userAssigned: req.body.account
    };

    var onCreateDocument = function (err, document) {        
      if (err) {
        console.log('ERROR on Create:', err.message);
        reject({error: true, code: 500, message: err.message});
      };

      resolve({error: false, data: document});
    };

    var newEquipment = new mongoEquipment(equipment);
  
    newEquipment.save(onCreateDocument);
  });

  var onFinish = function (data) {
    res.status(200).send(data);
  };

  saveEquipmentPromise
  .then(onFinish)
  .catch(function (err) {
    console.log('ERROR:', err.message);
    res.status(err.code).send(err.message);
  });
});

// TODO: Update
router.put('/equipments', function (req, res, next) {
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
