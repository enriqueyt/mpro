var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');

/* GET home page. */
router.get('/', function(req, res, next) {

  if(req.user){

    if(req.session.loginPath){
      res.redirect(req.session.loginPath);
    } else {
      
      if(res.user.role.role=='admin'){
        res.redirect('/admin/' + req.user.nickname);
      }
      
    }

  } else {
    res.render('index', { //csrfToken: req.csrfToken(),
      user : {}
    });

  }

});

module.exports = router;
