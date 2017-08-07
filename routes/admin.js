var express = require('express');
var router = express.Router();
var sanitizer = require('sanitizer');
var mongoSanitize = require('mongo-sanitize');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });
var mongoose = require('mongoose');
var account = mongoose.model('account');
var entity = mongoose.model('entity');
var bCrypt = require('bcrypt-nodejs');
var utils = require('../libs/utils');
var _ = require('underscore');

router.use(function (req, res, next) {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  req.body = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.body))));
  req.params = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.params))));
  req.query = JSON.parse(sanitizer.sanitize(JSON.stringify(mongoSanitize(req.query))));
  next();
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
      throw new Error('wtf!!');
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
    var query = {'identifier':identifier}, currentAccount={}, companies=[];
    
    account.findOne(query).exec()
    .then(function(user){
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
        return entity.find({type:'company'}).exec()
    })
    .then(function(data){
        companies=data.slice();        
        return entity.find({type:'branch_company'}).populate('company').exec();
    })
    .then(function(data){
        var bc = data.slice();
        return res.render('pages/company', {
            user : req.user || {},
            //csrfToken: req.csrfToken()
            currentAccount:currentAccount,
            companies:companies,
            branch_companies:bc,
            roles:account.schema.path('role').enumValues
        });
    })
    .catch(function(err){
        console.log('error:', err);
        res.redirect('/');
        return;
    });
});

router.get('/admin/:identifier/usuarios', function(req, res, next){
    if(!req.user){
        req.session.loginPath=null;
        console.log('no identifier');
        res.redirect('/login');
    }
    var identifier = req.params.identifier||req.user.identifier;
    
    var query = {}, currentAccounts={}, companies=[];
    
    account.find(query).populate('company').exec()
    .then(function(user){
        if(!user||user.length==0){
            throw new Error('wfT!!');
            return;
        }
        
        currentAccounts=user;
        
        var aux = _.find(currentAccounts, function(ca){return ca.identifier===identifier});
        currentAccounts.splice(currentAccounts.indexOf(aux),1);

        if(req.user.role!='admin'){
            throw new Error('just for main admins');
            return;
        }        
        return entity.find({type:'company'}).exec()
    })
    .then(function(data){        
        companies=data.slice();        
        return entity.find({type:'branch_company'}).populate('company').exec();
    })
    .then(function(data){
        var bc = data.slice();
        return res.render('pages/account', {
            user : req.user || {},
            //csrfToken: req.csrfToken()
            currentAccount:{company:{name:""}},
            currentAccounts:currentAccounts,
            companies:companies,
            branch_companies:bc,
            roles:account.schema.path('role').enumValues
        });
    })
    .catch(function(err){
        console.log('error:', err);
        res.redirect('/');
        return;
    });
});

router.post('/entity', function(req, res, next){
    if(!req.user||!req.user.username){
      return res.json({error:true, message:'Usuario no encontrado'});
    }

    var query = {name:req.body.name, email:req.body.email};

    entity.find(query).exec()
    .then(function(data){

      if(data.length>0){
        return res.json({error:true,message:'Ya existe el registro'});        
      }

      var obj = {
        name : req.body.name,
        email : req.body.email,
        phone : req.body.phone,
        location : req.body.location,        
        type : req.body.type
      };

      if(req.body.company!=undefined){
        obj.company=req.body.company;
      };

      var newEntity = new entity(obj);
      
      newEntity.save(callback);

      function callback(err, doc){        
        if(err)
          return res.json({error:true,message:err});
        return res.json({error:false, data:doc});
      };
    });
});

router.put('/entity', function(req, res, next){
    if(!req.user||!req.user.username){
      return res.json({error:true, message:'Usuario no encontrado'});
    }  
    var ObjectId = mongoose.Schema.Types.ObjectId;
		
		var query = { "_id" : new ObjectId(req.body._id) },			
			option = { upsert:true };
		
		entity.findOne(query, callback);

		function callback(err, doc){
			
			if(err || !doc){
				return res.json({ error:true, message:'No exite el documento' });
			}
			
			if(typeof req.body.name !== 'undefined')
				doc.reAssigned = req.body.name

			if(typeof req.body.email !== 'undefined')
				doc.email = req.body.email

			if(typeof req.body.phone !== 'undefined')
				doc.phone = req.body.phone

			if(typeof req.body.location !== 'undefined')
				doc.location = req.body.location

      if(typeof req.body.company !== 'undefined')
				doc.company = req.body.company

			doc.save();

			return res.json({ error:false, data:doc });
		};
});

router.post('/account', function(req, res, next){
  if(!req.user||!req.user.username){
    return res.json({error:true, message:'Usuario no encontrado'});
  }  
  var query = {username:req.body.username};
  
    account.findOne(query).exec()
    .then(function(data){
      
      if(data!=null){
        return res.json({error:true,message:'Ya existe el usuario'});
      }

      var obj= {
					name : req.body.name,
					username : req.body.username,
					password : utils.createHash('mpro-'+req.body.username.split('@')[0], bCrypt),
					email : req.body.username,
					role : req.body.role,
          company : req.body.branchcompany =='0' ? req.body.company : req.body.branchcompany,
          status:req.body.status=='on'?true:false
      };
                  
      var newAccount = new account(obj);
      
      newAccount.save(callback);

      function callback(err, doc){        
        if(err)
          return res.json({error:true,message:err});
        return res.json({error:false, data:doc});
      };
    });
});

router.put('/account', function(req, res, next){
    if(!req.user||!req.user.username){
      return res.json({error:true, message:'Usuario no encontrado'});
    }  
    var ObjectId = mongoose.Schema.Types.ObjectId;
		
		var query = { "_id" : new ObjectId(req.body._id) },			
			option = { upsert:true };
		
		account.findOne(query, callback);

		function callback(err, doc){
			
			if(err || !doc){
				return res.json({ error:true, message:'No exite el documento' });
			}
			
			if(typeof req.body.name !== 'undefined')
				doc.reAssigned = req.body.name

			if(typeof req.body.role !== 'undefined')
				doc.role = req.body.role

			if(typeof req.body.company !== 'undefined')
				doc.company = req.body.company

			doc.save();

			return res.json({ error:false, data:doc });
		};
});

module.exports = router;
