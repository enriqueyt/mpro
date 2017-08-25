var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');
var Bcrypt = require('bcrypt-nodejs');
var Functional = require('underscore');
var Utils = require('../libs/utils');

var Router = Express.Router();
var CsrfProtection = Csrf({cookie: true});
var Account = Mongoose.model('account');
var Entity = Mongoose.model('entity');

Router.use(function (req, res, next) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  req.body = JSON.parse(Sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(Sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(Sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
});

Router.get('/admin/:identifier', function(req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {'identifier': identifier};
  var currentAccount = {};
  
  Account.findOne(query).exec()
  .then(function (user) {    
    if (!user || user.length === 0) {
      throw new Error('wtf!!');
      return;
    }
    else {      
      currentAccount = user;
    }

    return res.render('pages/dashboard_admin', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount: currentAccount,      
    });
  })
  .catch(function (err) {
    console.log('error:', err);
    res.redirect('/');
    return;
  });
});

Router.get('/admin/:identifier/admin-activity-block', function (req, res, next) {
});

Router.get('/admin/:identifier/company', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {'identifier': identifier};
  var currentAccount = {};
  var companies = [];
    
  Account.findOne(query).exec()
  .then(function (user) {
    if (!user || user.length === 0) {
      throw new Error('No user found on the request');
      return;
    }
    else {      
      currentAccount = user;
    }

    if (user.role !== 'admin') {
      throw new Error('Just for main administrators');
      return;
    }

    return Entity.find({type: 'company'}).exec();
  })
  .then(function (data) {
    companies = data.slice();

    return Entity.find({type: 'branch_company'}).populate('company').exec();
  })
  .then(function (data) {
    var branchCompanies = data.slice();
    
    return res.render('pages/company/company_admin', {
      user: req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount: currentAccount,
      companies: companies,
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

Router.get('/admin/:identifier/users', function (req, res, next) {
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {};
  var currentAccounts = {};
  var companies = [];

  Account.find(query).populate('company').exec()
  .then(function (user) {
    if (!user || user.length === 0) {
      throw new Error('No user found on the request');
      return;
    }
        
    currentAccounts = user;
        
    var accountSearched = Functional.find(currentAccounts, function (currentAccount) {
      return currentAccount.identifier === identifier;
    });
    
    currentAccounts.splice(currentAccounts.indexOf(accountSearched), 1);

    if (req.user.role !== 'admin') {
      throw new Error('Just for main administrators');
      return;
    }

    return Entity.find({type: 'company'}).exec();
  })
  .then(function (data) {     
    companies = data.slice();

    return Entity.find({type: 'branch_company'}).populate('company').exec();
  })
  .then(function (data) {
    var branchCompanies = data.splice();
  
    return res.render('pages/account/account_admin', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount: {
        company: {
          name: ''
        }
      },
      currentAccounts: currentAccounts,
      companies: companies,
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

Router.post('/entity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'Usuario no encontrado'});
  }

  var query = {name: req.body.name, email: req.body.email};

  Entity.find(query).exec()
  .then(function (data) {

    if (data.length > 0) {
      return res.json({error: true, message: 'Ya existe el registro'});        
    }

    var obj = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,        
      type: req.body.type
    };

    if (req.body.company !== undefined) {
      obj.company = req.body.company;
    }

    var callback = function (err, doc) {        
      if (err)
        return res.json({error: true, message: err});

      return res.json({error: false, data: doc});
    };

    var newEntity = new entity(obj);
  
    newEntity.save(callback);
  });
});

Router.put('/entity', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'Usuario no encontrado'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id' : new ObjectId(req.body._id)};			
  var option = {upsert: true};
		
  var callback = function (err, doc) {
    if (err || !doc) {
      return res.json({error: true, message: 'No exite el documento'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      doc.reAssigned = req.body.name;
    }

    if (typeof req.body.email !== 'undefined') {
      doc.email = req.body.email;
    }

    if (typeof req.body.phone !== 'undefined') {
      doc.phone = req.body.phone;
    }

    if (typeof req.body.location !== 'undefined') {
      doc.location = req.body.location;
    }

    if (typeof req.body.company !== 'undefined') {
      doc.company = req.body.company;
    }

    doc.save();

    return res.json({error: false, data: doc});
  };

  Entity.findOne(query, callback);
});

Router.post('/account', function (req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'Usuario no encontrado'});
  }

  var query = {username: req.body.username};

  Account.findOne(query).exec()
  .then(function (data) {  
    if (data !== null) {
      return res.json({error: true, message: 'Ya existe el usuario'});
    }

    var obj = {
      name: req.body.name,
      username: req.body.username,
      password: Utils.createHash(''.concat('mpro-', req.body.username.split('@')[0], Bcrypt)),
      email: req.body.username,
      role: req.body.role,
      company: req.body.branchcompany === '0' ? req.body.company : req.body.branchcompany
    };

    var callback = function (err, doc) {        
      if (err)
        return res.json({error: true, message: err});

      return res.json({error: false, data: doc});
    };

    var newAccount = new account(obj);

    newAccount.save(callback);
  });
});

Router.put('/account', function(req, res, next) {
  if (!req.user || !req.user.username) {
    return res.json({error: true, message: 'Usuario no encontrado'});
  }

  var ObjectId = Mongoose.Schema.Types.ObjectId;
  var query = {'_id': new ObjectId(req.body._id)};			
  var option = {upsert: true};

  var callback = function (err, doc) {
    if (err || !doc) {
      return res.json({error: true, message: 'No exite el documento'});
    }
    
    if (typeof req.body.name !== 'undefined') {
      doc.reAssigned = req.body.name;
    }

    if (typeof req.body.role !== 'undefined') {
      doc.role = req.body.role;
    }

    if (typeof req.body.company !== 'undefined') {
      doc.company = req.body.company;
    }

    doc.save();

    return res.json({error: false, data: doc});
  };
		
  Account.findOne(query, callback);
});

module.exports = Router;
