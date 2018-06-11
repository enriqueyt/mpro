var Mongoose = require('mongoose');
var Functional = require('underscore');

var Utils = require('../../../libs/utils');

var mongoAccount = Mongoose.model('account');
var mongoEntity = Mongoose.model('entity');

var DATE_FORMAT = 'DD/MM/YYYY';

exports.getUsersViewData = function (req, res, next) {
  if (!req.user) {
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

    mongoAccount.find(query)
    .populate('company')
    .lean().exec()
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
    var tempUser = req.user || {};
    req.user = {};
    console.log(data[1])
    return res.render('pages/account/account_admin', {
      user : tempUser,
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
}