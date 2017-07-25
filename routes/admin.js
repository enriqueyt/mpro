var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');
var company = mongoose.model('company');

router.use(function (req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  req.body = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
});

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

router.get('/admin/:identifier', function(req, res, next){
  if(!req.user){
    req.session.loginPath=null;
    console.log('no identifier');
    res.redirect('/login');
  }
  var identifier = req.params.identifier||req.user.identifier;
  var query = {'identifier':identifier}, currentAccount={};
  
  account.findOne(query).exec()
  .then(function(user){    
    if(!user||user.length==0){
      throw new Error('wfT!!');
      return;
    }
    else{      
      currentAccount=user;
    }

    return res.render('pages/dashboard', {
      user : req.user || {},
      //csrfToken: req.csrfToken()
      currentAccount:currentAccount,      
    });

  })
  .catch(function(err){
    console.log('error:', err);
    res.redirect('/');
    return;
  });

});

router.get('/admin/:identifier/admin-activity-block', function(req, res, next){

});

router.get('/admin/:identifier/company', function(req, res, next){
    if(!req.user){
        req.session.loginPath=null;
        console.log('no identifier');
        res.redirect('/login');
    }
    var identifier = req.params.identifier||req.user.identifier;
    var query = {'identifier':identifier}, currentAccount={};
    
    account.findOne(query).exec()
    .then(function(user){    
        console.log('---------------------------')
        console.log(user)
        if(!user||user.length==0){
            throw new Error('wfT!!');
            return;
        }
        else{      
            currentAccount=user;
        }

        if(user.role!='admin'){
            throw new Error('Solo paa administradores generales');
            return;
        }
        return company.find({}).exec()
    })
    .then(function(companies){
        console.log(companies)
        return res.render('pages/company', {
            user : req.user || {},
            //csrfToken: req.csrfToken()
            currentAccount:currentAccount,
            companies:companies
        });
    })
    .catch(function(err){
        console.log('error:', err);
        res.redirect('/');
        return;
    });
});

router.post('/add-company', function(req, res, next){
  if(!req.user||!req.user.username){
    return res.json({error:true, message:'Usuario no encontrado'});
  }
  
  var query = {name:req.body.name, email:req.body.email};
    
    company.find(query).exec()
    .then(function(companyResult){      
      if(companyResult.length>0){
        return res.json({error:true,message:'Ya existe la empresa'});        
      }
      var newCompany = new company({
        name : req.body.name,
        email : req.body.email,
        phone : req.body.phone,
        location : req.body.location
      });
      
      newCompany.save(callback);

      function callback(err, doc){
        if(err)
          return res.json({error:true,message:err});
        return res.json({error:false, data:doc});
      };
    });
		
});

module.exports = router;
