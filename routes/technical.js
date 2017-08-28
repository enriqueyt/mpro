var Express = require('express');
var Sanitizer = require('sanitizer');
var Mongoose = require('mongoose');
var MongoSanitize = require('mongo-sanitize');
var Csrf = require('csurf');

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

Router.get('/technical/:identifier', function (req, res, next) { 
  if (!req.user) {
    req.session.loginPath = null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier || req.user.identifier;
  var query = {'identifier': identifier};
  var currentAccount = {};

  Account.findOne(query).populate('company').exec()
  .then(function (user){    
    if (!user || user.length === 0) {
      throw new Error('wtf!!');
      return;
    }

    currentAccount = user;

    return res.render('pages/dashboard', {
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

module.exports = Router;
