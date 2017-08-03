var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');
var entity = mongoose.model('entity');
var ObjectId = require('mongoose').Types.ObjectId; 
var _ = require('underscore');

router.use(function (req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  req.body = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
});


router.get('/admin_company/:identifier', function(req, res, next){
  if(!req.user){
    req.session.loginPath=null;
    console.log('no identifier');
    res.redirect('/login');
  }

  var identifier = req.params.identifier||req.user.identifier;
  var query = {'identifier':identifier}, currentAccount={};
  
  account.findOne(query).populate('company').exec()
  .then(function(user){    
    console.log('user')
    console.log(user)
    if(!user||user.length==0){
      throw new Error('wtf!!');
      return;
    }
    
    currentAccount=user;
    
    return res.render('pages/dashboard', {
      user : req.user || {},
      currentAccount:currentAccount,      
    });

  })
  .catch(function(err){
    console.log('error:', err);
    res.redirect('/');
    return;
  });
});

router.get('/admin_company/:identifier/company', function(req, res, next){
    console.log(req.user)
    if(!req.user){
        req.session.loginPath=null;
        console.log('no identifier');
        res.redirect('/login');
    }

    var identifier = req.params.identifier||req.user.identifier;
    var query = {'identifier':identifier}, currentAccount={}, companies=[];
    
    account.findOne(query).populate('company').exec()
    .then(function(user){
        if(!user||user.length==0){
            throw new Error('wfT!!');
            return;
        }
        
        currentAccount=user;

        if(user.role!='admin_company'){
            throw new Error('Solo para administradores');
            return;
        }
        return entity.find({type:'branch_company', company: new ObjectId(currentAccount.company._id)}).populate('company').exec()
    })
    .then(function(data){
        var bc = data.slice();
        return res.render('pages/company', {
            user : req.user || {},
            currentAccount:currentAccount,
            companies:currentAccount.company,
            branch_companies:bc
        });
    })
    .catch(function(err){
        console.log('error:', err);
        res.redirect('/');
        return;
    });
});

router.get('/admin_company/:identifier/usuarios', function(req, res, next){
    if(!req.user){
        req.session.loginPath=null;
        console.log('no identifier');
        res.redirect('/login');
    }
    var identifier = req.params.identifier||req.user.identifier;
    
    var query = { identifier:req.params.identifier }, currentAccounts={}, companies=[], branch_companies=[];
    
    account.findOne(query).populate('company').exec()
    .then(function(user){
        if(!user||user.length==0){
            throw new Error('wfT!!');
            return;
        }
        currentAccounts=user;        
        return entity.find({type:'branch_company', company: new ObjectId(user.company._id)}).exec()
    })
    .then(function(data){
        branch_companies = data.slice();
        var aux=[];
        _.each(branch_companies, function(item, i){
          aux.push(item._id);
        });        
        return account.find({company:{$in:aux}}).populate('company').exec();
    })
    .then(function(data){
        return res.render('pages/account', {
            user : req.user || {},
            companies:[],
            currentAccount:currentAccounts,
            currentAccounts:data,
            branch_companies:branch_companies,
            roles:account.schema.path('role').enumValues
        });
    })
    .catch(function(err){
        console.log('error:', err);
        res.redirect('/');
        return;
    });
});

module.exports = router;
