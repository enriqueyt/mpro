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
var Entity = Mongoose.model('entity');

Router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(MongoSanitize(req.query))));
  next();
});

Router.get('/admin_company/:identifier', function (req, res, next) {
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
    console.log('USER:\n\t', user);

    if (!user || user.length === 0) {
      throw new Error('wtf!!');
      return;
    }

    currentAccount = user;

    return res.render('pages/dashboard_admin_company', {
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

Router.get('/admin_company/:identifier/company', function (req, res, next) {
  console.log(req.user)
  
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {'identifier': identifier};
  var currentAccount = {};
  var companies = [];

  Account.findOne(query).populate('company').exec()
  .then(function (user) {
    if (!user || user.length === 0) {
      throw new Error('No user found on the request');
      return;
    }

    currentAccount = user;

    if (user.role !== 'admin_company') {
      throw new Error('Just for main administrators');
      return;
    }

    return Entity.find({type: 'branch_company', company: new ObjectId(currentAccount.company._id)}).populate('company').exec()
  })
  .then(function (data) {
    var branchCompanies = data.slice();
    
    return res.render('pages/company/company_admin_company', {
      user: req.user || {},
      currentAccount: currentAccount,
      companies: currentAccount.company,
      branchCompanies: branchCompanies
    });
  })
  .catch(function (err) {
    console.log('error:', err);
    res.redirect('/');
    return;
  });
});

Router.get('/admin_company/:identifier/users', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;

  var query = { identifier: req.params.identifier };
  var currentAccounts = {};
  var companies = [];
  var branchCompanies = [];
    
  Account.findOne(query).populate('company').exec()
  .then(function (user) {
    if (!user || user.length === 0) {
      throw new Error('No user found on the request');
      return;
    }

    currentAccounts = user;        
  
    return entity.find({type: 'branch_company', company: new ObjectId(user.company._id)}).exec()
  })
  .then(function (data) {
    branchCompanies = data.slice();

    var branchCompanyIds = Functional.reduce(branchCompanies, function(accumulator, branchCompany) {
      accumulator.push(branchCompany._id);

      return accumulator;
    }, []);        

    return Account.find({company: {$in: branchCompanyIds}}).populate('company').exec();
  })
  .then(function (data) {
    return res.render('pages/account/account_admin_company', {
      user: req.user || {},
      companies: [],
      currentAccount: currentAccounts,
      currentAccounts: data,
      branchCompanies: branchCompanies,
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
