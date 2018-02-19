var Mongoose = require('mongoose');

var Log = require('../../libs/log');

var mongoAccount = Mongoose.model('account');

/* ########################################################################## */
/* CREATE RESOURCES                                                           */
/* ########################################################################## */

exports.createAccount = function (req, res, next) {
  if (!req.user) {
    return res.json({error: true, message: 'No user found'});
  }

  var saveAccountPromise = new Promise(function (resolve, reject) {
    var account = {
      name    : req.body.name,
      username: req.body.username,
      password: Utils.createHash(''.concat('mpro-', req.body.username.split('@')[0]), Bcrypt),
      email   : req.body.username,
      role    : req.body.role,
      status  : req.body.status,
      company : req.body.branchCompany === undefined ? req.body.company : req.body.branchCompany,
      //company : req.body.branchcompany === '0' ? req.body.company : req.body.branchcompany,
      image   : req.body.image
    };
  
    var onCreateDocument = function (err, document) {        
      if (err) {
        Log.error({
          parameters: ['ACCOUNT_EXCEPTION', err],
          //text      : 'Exception! '.concat(err),
          user      : req.user._id,
          model     : err
        });

        reject({error: true, code: 500, message: err.message});
      };

      Log.debug({
        parameters: ['ACCOUNT_CREATE_SUCCESS', req.user.name, document.name],
        //text      : 'Success on create! '.concat('User ', req.user.name, ' creates account ', document.name),
        type      : 'create_account',
        user      : req.user._id,
        model     : document
      });

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
    res.status(err.code).send(err.message);
  });
};

/* ########################################################################## */
/* READ RESOURCES                                                             */
/* ########################################################################## */

exports.getAccounts = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var page = req.params.page || 0;
  var quantity = req.params.quantity || 0;
  var query = {};
  var projection = {username: 0, password: 0};

  if (typeof req.params.search !== 'undefined') {
    var searchPattern = req.params.search;

    query = {$or: [{name: searchPattern}, {'company.name': searchPattern}, {role: searchPattern}]};
  }

  mongoAccount
  .find(query, projection)
  .populate('company')
  .skip(page * quantity)
  .limit(page)
  .exec()
  .then(function (accounts) {
    res.status(200).send({error: false, data: accounts});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

exports.getAccount = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {_id: req.params.account};
  var projection = {username: 0, password: 0};

  mongoAccount.findOne(query, projection).populate('company').exec()
  .then(function (account) {
    res.status(200).send({error: false, data: account});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

exports.getTechniciansByCompany = function (req, res, next) {
  var branchCompaniesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'branchCompany', company: req.params.company};

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
      var projection = {_id: 1, name: 1};

      mongoAccount.find(query, projection).exec()
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
};

exports.getTechniciansByBranchCompany = function (req, res, next) {
  var accountsPromise = new Promise(function (resolve, reject) {
    var query = {role: 'technician', company: req.params.branchCompany};
    var projection = {_id: 1, name: 1};

    mongoAccount.find(query, projection).exec()
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
};

/* ########################################################################## */
/* UPDATE RESOURCES                                                           */
/* ########################################################################## */

exports.updateAccount = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {_id: req.params.equipment};	
  var option = {new: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    document.name = req.body.name;
  }

  if (typeof req.body.role !== 'undefined') {
    document.role = req.body.role;
  }

  if (typeof req.body.company !== 'undefined') {
    document.company = req.body.company;
  }

  var onUpdateDocument = function (err, document) {
    if (err) {
      Log.error({
        parameters: ['ACCOUNT_EXCEPTION', err],
        //text      : 'Exception! '.concat(err),
        type      : 'update_account',
        user      : req.user._id,
        model     : err
      });

      res.status(500).send({error: true, message: 'Unexpected error was occurred'});
    }
    
    if (!document) {
      res.status(404).send({error: true, message: 'Document does not exist'});
    }

    Log.debug({
      parameters: ['ACCOUNT_UPDATE_SUCCESS', req.user.name, document.name],
      //text      : 'Success on update! '.concat('User ', req.user.name, ' updates account ', document.name),
      type      : 'update_account',
      user      : req.user._id,
      model     : document
    });

    res.status(200).send({error: false, data: document});
  };
		
  mongoEntity.findOneAndUpdate(query, {$set: setValues}, option, onUpdateDocument);
};

/* ########################################################################## */
/* DELETE RESOURCES                                                           */
/* ########################################################################## */
