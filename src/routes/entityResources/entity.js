var Mongoose = require('mongoose');

var Log = require('../../libs/log');

var mongoEntity = Mongoose.model('entity');

/* ########################################################################## */
/* CREATE RESOURCES                                                           */
/* ########################################################################## */

exports.createEntity = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveEntityPromise = new Promise(function (resolve, reject) {
    var entity = {
      name    : req.body.name,
      email   : req.body.email,
      phone   : req.body.phone,
      location: req.body.location,        
      type    : req.body.type
    };

    if (typeof req.body.company !== 'undefined') {
      entity.company = req.body.company;
    };
  
    var onCreateDocument = function (err, document) {        
      if (err) {
        Log.error({
          parameters: ['ENTITY_EXCEPTION', req.user.name, document.name],
          //text      : 'Exception! '.concat(err),
          type      : 'create_entity',
          user      : req.user._id,
          model     : err
        });

        reject({error: true, code: 500, message: err.message});
      };

      Log.debug({
        parameters: ['ENTITY_CREATE_SUCCESS', req.user.name, document.name],
        //text      : 'Success on create! '.concat('User ', req.user.name, ' creates entity ', document.name),
        type      :'create_entity',
        user      : req.user._id,
        model     : document
      });

      resolve({error: false, data: document});
    };
  
    var newEntity = new mongoEntity(entity);

    newEntity.save(onCreateDocument);
  });

  var onFinish = function (data) {
    res.status(200).send(data);
  };

  saveEntityPromise
  .then(onFinish)
  .catch(function (err) {
    res.status(err.code).send(err.message);
  });
};

/* ########################################################################## */
/* READ RESOURCES                                                             */
/* ########################################################################## */

exports.getEntities = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var page = req.params.page || 0;
  var quantity = req.params.quantity || 0;
  var query = {type: req.params.type};

  if (typeof req.params.search !== 'undefined') {
    var searchPattern = req.params.search;

    query['$or'] = [{name: searchPattern}, {location: searchPattern}, {'company.name': searchPattern}];
  }

  mongoEntity
  .find(query)
  .populate('company')
  .skip(page * quantity)
  .limit(page)
  .exec()
  .then(function (entities) {
    res.status(200).send({error: false, data: entities});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

exports.getEntity = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {_id: req.params.entity};

  mongoEntity.findOne(query).populate('company').exec()
  .then(function (entity) {
    res.status(200).send({error: false, data: entity});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

exports.getBranchCompaniesByCompany = function (req, res, next) {
  var branchCompaniesPromise = new Promise(function (resolve, reject) {
    var query = {type: 'branchCompany', company: req.params.company};
    var select = {_id: 1, name: 1};

    mongoEntity.find(query, select).populate('company').exec()
    .then(function (branchCompanies) {
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
};

/* ########################################################################## */
/* UPDATE RESOURCES                                                           */
/* ########################################################################## */

exports.updateEntity = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {_id: req.params.equipment};	
  var option = {new: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    document.name = req.body.name;
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

  var onUpdateDocument = function (err, document) {
    if (err) {
      Log.error({
        parameters: ['ENTITY_EXCEPTION', err],
        //text      : 'Exception! '.concat(err),
        type      : 'update_entity',
        user      : req.user._id,
        model     : err
      });

      res.status(500).send({error: true, message: 'Unexpected error was occurred'});
    }
    
    if (!document) {
      res.status(404).send({error: true, message: 'Document does not exist'});
    }

    Log.debug({
      parameters: ['ENTITY_UPDATE_SUCCESS', req.user.name, document.name],
      //text      : 'Success on update! '.concat('User ', req.user.name, ' updates entity ', document.name),
      type      : 'update_entity',
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
