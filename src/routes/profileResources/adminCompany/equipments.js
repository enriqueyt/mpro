var Mongoose = require('mongoose');
var Functional = require('underscore');

var mongoAccount = Mongoose.model('account');
var mongoEntity = Mongoose.model('entity');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

exports.getEquipmentsViewData = function (req, res, next) {
  if (!req.user) {
    console.log('No identifier');
    res.redirect('/login');
  }

  var accountPromise = new Promise(function (resolve, reject) {
    var identifier = req.params.identifier || req.user.identifier;
    var role = req.params.role || req.user.role;
    var username = req.user.username;
    var query = {'identifier': identifier, 'role': role, username: username};
  
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
      var query = {company: user.company._id};

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
      var query = {type: 'branchCompany', company: data[0].company._id} 
    
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

      mongoEquipment.find(query).populate('equipmentType').populate('branchCompany').populate('userAssigned').exec()
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
    var tempUser = req.user || {};
    req.user = {};

    return res.render('pages/equipment/equipment_admin_company', {
      user: tempUser,
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
};
