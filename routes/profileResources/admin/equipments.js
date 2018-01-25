var Mongoose = require('mongoose');
var Functional = require('underscore');

var mongoEntity = Mongoose.model('entity');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

exports.getEquipmentsViewData = function (req, res, next) {
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
};
