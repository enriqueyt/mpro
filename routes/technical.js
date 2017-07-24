var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');

router.use(function (req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  req.body = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
});

router.get('/technical/:identifier', function(req, res, next){

});
module.exports = router;
