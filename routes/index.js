var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var ObjectId = require('mongoose').Types.ObjectId;
var Functional = require('underscore');

var Utils = require('../libs/utils');

var router = Express.Router();
var csrfProtection = Csrf({ cookie: true });
var mongoAccount = Mongoose.model('account');
var mongoEntity = Mongoose.model('entity');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');
var mongoMaintenanceActivity = Mongoose.model('maintenanceActivity');
var mongoMaintenanceActivityAttention = Mongoose.model('maintenanceActivityAttention');

var DATE_FORMAT = 'DD/MM/YYYY';

var util = require('util');

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.user) {
    if (req.session.loginPath) {
      res.redirect(req.session.loginPath);
    }
    else {
      console.log('RES:\n\t', JSON.stringify(res))
      if (res.user.role.role === 'admin') {
        res.redirect(''.concat('/admin/', req.user.nickname));
      }
    }
  }
  else {
    res.render('pages/login', { 
      //csrfToken: req.csrfToken(),
      user: {}
    });
  }
});

router.get('/home/:identifier/companies/:id', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  var companyPromise = new Promise(function (resolve, reject) {
    var query = {_id: req.params.id, type: 'company'};

    mongoEntity.findOne(query).exec()
    .then(function (company) {
      if (!company || company.length === 0) {
        var message = 'No company found';
        reject(new Error(message));
      }
      else {      
        var identifiers = [];

        if (req.user.role === 'admin') {
          identifiers.push(company._id);
        }

        resolve([company, identifiers]);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchBranchCompanies = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {type: 'branchCompany', company: new ObjectId(data[0]._id)};
      
      mongoEntity.find(query).exec()
      .then(function (branchCompanies) {
        data[1] = Functional.reduce(branchCompanies, function (accumulator, branchCompany) {
          accumulator.push(branchCompany._id);

          return accumulator;
        }, data[1]);
        
        data.push(branchCompanies);

        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  }

  var onFetchAccounts = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {company: {$in: data[1]}};

      mongoAccount.find(query).exec()
      .then(function (users) {
        data.push(users);

        resolve(data);
      })
      .catch(function (err) {
        reject(err);
      });
    });

    return promise;
  }

  var onRender = function (data) {
    return res.render('pages/entity', {
      user: req.user || {},
      entity: data[0] || [],
      entitiesRelated: data[2] || [],
      accounts: data[3]
    });
  }

  companyPromise
  .then(onFetchBranchCompanies)
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/home/:identifier/branchCompanies/:id', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  var branchCompanyPromise = new Promise(function (resolve, reject) {
    var query = {_id: req.params.id, type: 'branchCompany' };
  
    mongoEntity.findOne(query).exec()
    .then(function (branchCompany) {
      if (!branchCompany || branchCompany.length === 0) {
        var message = 'No branch company found';
        reject(new Error(message));
      }
      else {
        resolve([branchCompany]);
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchAccounts = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {company: data[0]._id};

      mongoAccount.find(query).exec()
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
    return res.render('pages/entity', {
      user: req.user || {},
      entity: data[0] || [],
      entitiesRelated: [],
      accounts: data[1]
    });
  };

  branchCompanyPromise
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
});

router.get('/home/:identifier/equipment/:id', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('No identifier');
    res.redirect('/login');
  }

  var equipmentPromise = new Promise(function (resolve, reject) {
    var query = {_id: req.params.id};

    mongoEquipment
    .findOne(query)
    .populate({path: 'branchCompany', select: {_id: 0, name: 1}})
    .populate({path: 'equipmentType', select: {_id: 0, name: 1}})
    .populate({path: 'userAssigned', select: {_id: 0, name: 1}})
    .lean()
    .exec()
    .then(function (equipment) {
      if (!equipment || equipment.length === 0) {
        var message = 'No equipment found';
        reject(new Error(message));
      }
      else {
        resolve(equipment);
      }
    })
  });

  var classifyMaintenanceActivityDates = function (equipment) {
    var currentDate = Date.now();
    var maintenanceActivityDatesClassified = {
      attended: [],
      nextToAttend: null,
      toAttend: []
    };

    equipment['maintenanceActivityDates'] = equipment.maintenanceActivityDates.sort(function (a, b) {
      return (new Date(b.date)).getTime() < (new Date(a.date)).getTime();
    });

    maintenanceActivityDatesClassified = Functional.reduce(equipment.maintenanceActivityDates, function(accumulator, maintenanceActivityDate) {
      var date = Utils.getEndDate(maintenanceActivityDate.date);

      if (accumulator.nextToAttend === null) {
        if (date.getTime() < currentDate) {
          accumulator['attended'].push(maintenanceActivityDate);  
        }
        else {
          accumulator['nextToAttend'] = maintenanceActivityDate;  
        }
      }
      else {
        accumulator['toAttend'].push(maintenanceActivityDate);
      }

      return accumulator;
    }, maintenanceActivityDatesClassified);

    return [equipment, maintenanceActivityDatesClassified];
  };

  var getNextMaintenanceAttention = function (data) {
    var enableStart = function (maintenanceActivityDate) {
      var enable = false;
      var currentDate = Date.now();
      var rangeDates = Utils.getLimitDates(maintenanceActivityDate.date);

      if (maintenanceActivityDate.started === false && 
        rangeDates.min.getTime() <= currentDate && 
        currentDate <= rangeDates.max.getTime()) {
        enable = true;
      }

      return enable;
    };

    var enableFinish = function (maintenanceActivityDate) {
      var enable = false;

      if (maintenanceActivityDate.started === true &&
        typeof maintenanceActivityDate.finishedDate === 'undefined') {
        enable = true;
      }

      return enable;
    };

    var formatDates = function (maintenanceActivityDates) {
      return Functional.map(maintenanceActivityDates, function (maintenanceActivityDate) {
        return maintenanceActivityDate['date'] = Utils.formatDate(maintenanceActivityDate.date, DATE_FORMAT);
      });
    }

    var promise = new Promise(function (resolve, reject) {
      if (typeof data[1].nextToAttend !== null) {
        var query = {identifier: data[1].nextToAttend.identifier};
  
        mongoMaintenanceActivityAttention
        .find(query)
        .populate({path: 'maintenanceActivity', select: {_id: 0, name: 1}})
        .exec()
        .then(function (maintenanceActivityAttentions) {
          var result = {};

          if (enableStart(data[1].nextToAttend) === true) {
            result['enableStart'] = true;
            result['enableFinish'] = false;
          }
          else if (enableFinish(data[1].nextToAttend) === true) {
            result['enableStart'] = false;
            result['enableFinish'] = true;
          }
          else {
            result['enableStart'] = false;
            result['enableFinish'] = false;
          }

          result['maintenanceActivityDate'] = data[1].nextToAttend._id;
          result['date'] = Utils.formatDate(data[1].nextToAttend.date, DATE_FORMAT);
          result['maintenanceActivityAttentions'] = maintenanceActivityAttentions;
          
          delete data[1].nextToAttend;

          formatDates(data[1].attended);
          formatDates(data[1].toAttend);

          data.push(result);
          resolve(data);
        })
        .catch(function (err) {
          reject({error: true, code: 500, message: err.message});
        });
      }
      else {
        data.push(null);
        resolve(data);
      }
    });
  
    return promise;
  };

  var onRender = function (data) {
    return res.render('pages/equipment', {
      user: req.user || {},
      equipment: data[0],
      maintenanceActivityDates: data[1],
      nextMaintenanceActivityAttention: data[2]
    });
  };

  equipmentPromise
  .then(classifyMaintenanceActivityDates)
  .then(getNextMaintenanceAttention)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR: ', err);
    res.redirect('/');
    return;
  });
});

router.get('/maintenanceActivitiesByEquipmentType/:equipmentType', function (req, res, next) {
  var maintenanceActivitiesPromise = new Promise(function (resolve, reject) {
    var query = {equipmentType: new ObjectId(req.params.equipmentType)};
    var select = '_id name';

    mongoMaintenanceActivity.find(query, select).exec()
    .then(function (maintenanceActivities) {
      resolve(maintenanceActivities);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  maintenanceActivitiesPromise
  .then(function (maintenanceActivities) {
    res.status(200).send({error: false, data: maintenanceActivities});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/equipmentsByEquipmentType/:equipmentType', function (req, res, next) {
  var equipmentsPromise = new Promise(function (resolve, reject) {
    var query = {equipmentType: new ObjectId(req.params.equipmentType)};
    var projection = '_id name'; // TODO: Change to JSON string for readability

    mongoEquipment.find(query, projection).exec()
    .then(function (equipments) {
      resolve(equipments);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  equipmentsPromise
  .then(function (equipments) {
    res.status(200).send({error: false, data: equipments});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/branchCompaniesByCompany/:company', function (req, res, next) {
  var branchCompaniesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'branchCompany', company: new ObjectId(req.params.company)};
    var select = '_id name';

    mongoEntity.find(query, select).populate('company').exec()
    .then(function (branchCompanies) {
      console.log(branchCompanies)
      resolve(branchCompanies);
    })
    .catch(function (err) {
      reject(err);
    });
  });
  
  branchCompaniesPromise
  .then(function (branchCompanies) {
    res.status(200).send({error: false, data: branchCompanies});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/equipmentTypesByCompany/:company', function (req, res, next) {
  var equipmentTypesPromise = new Promise(function (resolve, reject) {
    var query = {company: new ObjectId(req.params.company)};
    var select = '_id name';

    mongoEquipmentType.find(query, select).exec()
    .then(function (equipmentTypes) {
      resolve(equipmentTypes);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  equipmentTypesPromise
  .then(function (equipmentTypes) {
    res.status(200).send({error: false, data: equipmentTypes});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/techniciansByCompany/:company', function (req, res, next) {
  var branchCompaniesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'branchCompany', company: new ObjectId(req.params.company)};

    mongoEntity.find(query).exec()
    .then(function (branchCompanies) {
      resolve(branchCompanies);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchAccounts = function (branchCompanies) {
    var branchCompanyIds = Functional.reduce(branchCompanies, function (accumulator, branchCompany) {
      accumulator.push(branchCompany._id);
      return accumulator;
    }, []);

    var promise = new Promise(function (resolve, reject) {
      var query = {role: 'technician', company: {$in: branchCompanyIds}};
      var select = '_id name';

      mongoAccount.find(query, select).exec()
      .then(function (accounts) {
        resolve(accounts);
      })
      .catch(function (err) {
        reject(err);
      });
    });
    
    return promise;
  };

  branchCompaniesPromise
  .then(onFetchAccounts)
  .then(function (accounts) {
    res.status(200).send({error: false, data: accounts});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/techniciansByBranchCompany/:branchCompany', function (req, res, next) {
  var accountsPromise = new Promise(function (resolve, reject) {
    var query = {role: 'technician', company: new ObjectId(req.params.branchCompany)};
    var select = '_id name';

    mongoAccount.find(query, select).exec()
    .then(function (accounts) {
      resolve(accounts);
    })
    .catch(function (err) {
      reject(err);
    });
  });

  accountsPromise
  .then(function (accounts) {
    res.status(200).send({error: false, data: accounts});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: err.message});
  });
});

router.get('/accounts/:identifier', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var query = {identifier: req.params.identifier};

  function onFetchAccount(err, data) {
    if (err) {
      //redireccionar a un router escribiendo el error, por ahora
      data = [];
    }

    return res.render('pages/account-home', {
      user: req.user || {},        
      account: data
    });

  mongoAccount.findOne(query).populate('company').exec(onFetchAccount);
  };
});

module.exports = router;
