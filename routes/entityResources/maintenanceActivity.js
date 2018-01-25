var Mongoose = require('mongoose');
var Functional = require('underscore');

var mongoMaintenanceActivity = Mongoose.model('maintenanceActivity');

/* ########################################################################## */
/* CREATE RESOURCES                                                           */
/* ########################################################################## */

exports.createMaintenanceActivities = function (req, res, next) {
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
};

/* ########################################################################## */
/* READ RESOURCES                                                             */
/* ########################################################################## */

exports.getMaintenanceActivity = function (req, res, next) {
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
};

/* ########################################################################## */
/* UPDATE RESOURCES                                                           */
/* ########################################################################## */

exports.updateMaintenanceActivity = function (req, res, next) {
  if (!req.user || !req.user.username) {
    res.status(401).send({error: true, message: 'No user found'});
  }

  var query = {'_id': req.params.maintenanceActivity};			
  var option = {new: true};
  var setValues = {};

  if (typeof req.body.name !== 'undefined') {
    setValues['name'] = req.body.name;
  }

  if (typeof req.body.description !== 'undefined') {
    setValues['description'] = req.body.description;
  }

  if (typeof req.body.status !== 'undefined') {
    setValues['status'] = req.body.status;
  }

  if (typeof req.body.deleted !== 'undefined') {
    setValues['deleted'] = req.body.deleted;
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
};

/* ########################################################################## */
/* DELETE RESOURCES                                                           */
/* ########################################################################## */
