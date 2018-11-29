var Mongoose = require('mongoose');

var mongoAccount = Mongoose.model('account');
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
    var username = req.user.username;
    var query = {'identifier': identifier, 'role': role, username: username};
  
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

  var onFetchEquipments = function (user) {
    var promise = new Promise(function (resolve, reject) {
      var query = {branchCompany: user.company._id};

      mongoEquipment.find(query).populate('equipmentType').populate('userAssigned').exec()
      .then(function (equipments) {
        resolve([user, equipments]);
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

    return res.render('pages/equipment/equipment_technician', {
      user: tempUser,
      currentAccount: data[0],
      equipments: data[1]
    });
  };

  accountPromise
  .then(onFetchEquipments)
  .then(onRender)
  .catch(function (err) {
    console.log('ERROR:', err);
    res.redirect('/');
    return;
  });
};
