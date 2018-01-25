var Mongoose = require('mongoose');
var Functional = require('underscore');

var Utils = require('../../libs/utils');

var mongoEquipment = Mongoose.model('equipment');

/* ########################################################################## */
/* CREATE RESOURCES                                                           */
/* ########################################################################## */

exports.createEquipment = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var saveEquipmentPromise = new Promise(function (resolve, reject) {
    var equipment = {
      name         : req.body.name,
      code         : req.body.code,
      location     : req.body.location,
      branchCompany: req.body.branchCompany,
      equipmentType: req.body.equipmentType,
      userAssigned : req.body.account
    };

    var onCreateDocument = function (err, document) {        
      if (err) {
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
    res.status(err.code).send(err.message);
  });
};

/* ########################################################################## */
/* READ RESOURCES                                                             */
/* ########################################################################## */

exports.getEquipments = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var page = req.params.page || 0;
  var quantity = req.params.quantity || 0;
  var query = {};

  if (typeof req.params.search !== 'undefined') {
    var searchPattern = req.params.search;

    query = {$or: [{name: searchPattern}, {code: searchPattern}, {location: searchPattern}]};
  }

  mongoEquipment.find(query).populate('branchCompany').populate('equipmentType')
  .skip(page * quantity).limit(page).exec()
  .then(function (equipments) {
    res.status(200).send({error: false, data: equipments});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

exports.getEquipment = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.equipment};

  mongoEquipment.findOne(query).populate('company').exec()
  .then(function (equipment) {
    res.status(200).send({error: false, data: equipment});
  })
  .catch(function (err) {
    res.status(500).send({error: true, message: 'Unexpected error was occurred'});
  });
};

/* ########################################################################## */
/* UPDATE RESOURCES                                                           */
/* ########################################################################## */

exports.updateEquipment = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.equipment};	
  var option = {new: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    setValues['name'] = req.body.name;
  }

  if (typeof req.body.code !== 'undefined') {
    setValues['code'] = req.body.code;
  }

  if (typeof req.body.location !== 'undefined') {
    setValues['location'] = req.body.location;
  }

  if (typeof req.body.branchCompany !== 'undefined') {
    setValues['branchCompany'] = req.body.branchCompany;
  }

  if (typeof req.body.equipmentType !== 'undefined') {
    setValues['equipmentType'] = req.body.equipmentType;
  }

  if (typeof req.body.account !== 'undefined') {
    setValues['userAssigned'] = req.body.account;
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
		
  mongoEquipment.findOneAndUpdate(query, {$set: setValues}, option, onUpdateDocument);
};

exports.updateMaintenanceActivityDate = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'maintenanceActivityDates._id': req.params.maintenanceActivityDate};
  var option = {upsert: false};
  var setValues = {};

  if (typeof req.body.started !== 'undefined') {
    setValues['started'] = req.body.started;
  }

  if (typeof req.body.finished !== 'undefined') {
    setValues['finished'] = req.body.finished;
    setValues['finishedDate'] = Date.now();
  }

  var transformValues = function (values) {
    var newValues = Functional.reduce(
      Object.keys(values), 
      function (accumulator, key) {
        accumulator['maintenanceActivityDates.$.'.concat(key)] = values[key];
        return accumulator;
      }, 
      {});

      return newValues;
  }

  var onUpdateDocument = function (err, document) {
    if (err) {
      res.status(500).send({error: true, message: 'Unexpected error was occurred'});
    }

    if (document.nModified === 0) {
      res.status(404).send({error: true, message: 'Document does not exist'});
    }

    res.status(200).send({error: false, data: document}); // This document contains information related to update process status.
  }

  mongoEquipment.update(query, {$set: transformValues(setValues)}, option, onUpdateDocument);
};

/* ########################################################################## */
/* DELETE RESOURCES                                                           */
/* ########################################################################## */
