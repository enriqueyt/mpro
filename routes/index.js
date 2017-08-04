var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');
var entity = mongoose.model('entity');
var _ = require('underscore');
var ObjectId = require('mongoose').Types.ObjectId; 

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
    res.render('pages/login', { //csrfToken: req.csrfToken(),
      user : {}
    });

  }

});

router.get('/home/:identifier/company/:id', function(req, res, next){
  if(!req.user){
      req.session.loginPath=null;
      console.log('no identifier');
      res.redirect('/login');
  }

  var query = { _id : req.params.id, type : 'company' }, _entity;

  entity
    .findOne(query)
    .exec()
    .then(function(data){
      _entity=data;
      query={type:'branch_company', company: new ObjectId(data._id)};
      return entity.find(query).exec();
    })
    .then(function(data){
        entitybc=data;
        var ids=[];
      _.each(entitybc, function(item, i){
        ids.push(item._id);
      });
      query={company:{$in:ids}};
      return account.find(query).exec();
    })
    .then(function(data){
        return res.render('home/home_page',{
          user : req.user || {},
          entity:_entity||[],
          entitybc:entitybc||[],
          accounts:data
        });
    })
    
});

router.get('/home/:identifier/branch_company/:id', function(req, res, next){
  if(!req.user){
      req.session.loginPath=null;
      console.log('no identifier');
      res.redirect('/login');
  }
  return res.render('home/branch_company',{
    user : req.user || {}
  })
});

router.get('/get-branch-company-by-company/:company', function(req, res, next){
  
  var query = { type : 'branch_company', company : new ObjectId(req.params.company) }

  entity.find(query).populate('company').exec(callback);

  function callback(err, branchCompany){
    if(err)
        return res.json({ error:true, message : err });
      return res.json({ error:false, data:branchCompany });
  };

})

module.exports = router;
