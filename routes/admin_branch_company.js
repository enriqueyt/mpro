var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var ObjectId = require('mongoose').Types.ObjectId; 
var Functional = require('underscore');

var Router = Express.Router();
var CsrfProtection = Csrf({cookie: true});
var Account = Mongoose.model('account');

Router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

Router.get('/admin_branch_company/:identifier', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {'identifier': identifier};
  var currentAccount = {};

  Account.findOne(query).populate('company').exec()
  .then(function (user) {    
    if (!user || user.length === 0) {
      throw new Error('wtf!!');
      return;
    }

    currentAccount = user;
    
    return res.render('pages/dashboard_admin_branch_company', {
      user: req.user || {},
      currentAccount: currentAccount      
    });
  })
  .catch(function (err) {
    console.log('error:', err);
    res.redirect('/');
    return;
  });
});

Router.get('/admin_branch_company/:identifier/users', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {identifier: req.params.identifier};
  var currentAccounts = {};
    
  Account.findOne(query).populate('company').exec()
  .then(function (user) {
    if (!user || user.length == 0) {
      throw new Error('No user on the request');
      return;
    }

    currentAccounts = user;
    
    return Account.find({role: 'technical', company: new ObjectId(user.company._id)}).populate('company').exec();
  })
  .then(function (data) {
    return res.render('pages/account_admin_branch_company', {
      user: req.user || {},
      companies: [],
      currentAccount: currentAccounts,
      currentAccounts: data,
      branchCompanies: [],
      roles: Account.schema.path('role').enumValues
    });
  })
  .catch(function (err) {
    console.log('error:', err);
    res.redirect('/');
    return;
  });
});

module.exports = Router;
