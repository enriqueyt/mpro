var Mongoose = require('mongoose');

var mongoAccount = Mongoose.model('account');
var mongoEquipmentType = Mongoose.model('equipmentType');
var mongoEquipment = Mongoose.model('equipment');

exports.getEquipmentsViewData = function (req, res, next) {
  if (!req.user) {
    console.log('No identifier');
    res.redirect('/login');
  }

  var populateAccountCompanyPromise = function (account) {
    var promise = new Promise(function (resolve, reject) {
      mongoAccount.populate(account, {path: 'company.company', model: 'entity'}, function (err, account) {
        if (err) {
          reject(err);
        }
        else {
          resolve(account);
        }
      });
    });

    return promise;
  };

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
        var promise = populateAccountCompanyPromise(user);

        promise
        .then(function (account) {
          resolve(account);
        })
        .catch(function (err) {
          reject(err);
        });
      }
    })
    .catch(function (err) {
      reject(err);
    });
  });

  var onFetchEquipmentTypes = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {company: user.company.company._id};

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

  var onFetchEquipments = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {branchCompany: data[0].company._id};

      mongoEquipment.find(query).populate('equipmentType').populate('userAssigned').exec()
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

  var onFetchAccounts = function (data) {
    var promise = new Promise(function (resolve, reject) {
      var query = {role: 'technician', company: data[0].company._id};

      mongoAccount.find(query).exec()
      .then(function (accounts) {
        data.push(accounts);
        resolve(data);
      })
      .then(function (err) {
        reject(err);
      });
    });

    return promise;
  }

  var onRender = function (data) {
    var tempUser = req.user || {};
    req.user = {};

    return res.render('pages/equipment/equipment_admin_branch_company', {
      user : tempUser,
      currentAccount: data[0],
      equipmentTypes: data[1],
      equipments: data[2],
      accounts: data[3]
    });
  };

  accountPromise
  .then(onFetchEquipmentTypes)
  .then(onFetchEquipments)
  .then(onFetchAccounts)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
};
