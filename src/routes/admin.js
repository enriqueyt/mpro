var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');

var Log = require('../libs/log');
var SessionHandle = require('../libs/sessionHandle');

var Activities = require('./profileResources/admin/activities');
var Companies = require('./profileResources/admin/companies');
var Users = require('./profileResources/admin/users');
var Equipments = require('./profileResources/admin/equipments');

var router = Express.Router();
var csrfProtection = Csrf({cookie: true});
var mongoAccount = Mongoose.model('account');

var moment = require('moment');

router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

router.get('/admin', SessionHandle.isLogged, function (req, res, next) {
  if (!req.user) {
    console.log('No identifier found');
    res.redirect('/login');
  }

  var accountPromise = new Promise(function (resolve, reject) {
    var identifier = req.user.identifier;
    var role = req.params.role || req.user.role;
    var username = req.user.username;
    var query = {'identifier': identifier, 'role': role, username: username};
    
    mongoAccount.findOne(query).exec()
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

  var onFetchActivities = function(user){
    
    return new Promise(function(resolve, reject){
      Log.getLogs(10,0).onFetchByRole(user)
      .then(function(data){        
        resolve({
          user:user,
          activity:data, 
          offSet:data.length,
          limit:10, 
          skip:0
        });
      })
      .catch(reject);

    });
  };

  var onRender = function (data) {
    var tempUser = req.user||{};
    req.user={};
    return res.render('pages/dashboard/dashboard_admin', {
      user : tempUser,
      currentAccount: data.user,
      activity:data.activity,
      limit:10,
      skip:0
    });
  };

  accountPromise
    .then(onFetchActivities)
    .then(onRender)
    .catch(function (err) {
      console.log('ERROR:', err);
      res.redirect('/');
      return;
    });
});

router.get('/admin/activities', SessionHandle.isLogged, Activities.getActivitiesViewData);

router.get('/admin/companies', SessionHandle.isLogged, Companies.getCompaniesViewData);

router.get('/admin/users', SessionHandle.isLogged, Users.getUsersViewData);

router.get('/admin/equipments', SessionHandle.isLogged, Equipments.getEquipmentsViewData);

module.exports = router;
