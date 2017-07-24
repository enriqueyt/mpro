var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var account = mongoose.model('account');
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');

var users = {};

module.exports = function(passport){

	var isValidPassword = function(doc, password){		
		return bCrypt.compareSync(password, doc.password);
	};

	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};

	passport.serializeUser(function(user, done){
		//console.log('usuario serializado: ' + user );
		return done(null, user);
	});

	passport.deserializeUser(function(id, done){
		account.findById(id, function(err, doc){
			//console.log('deserialize User: ' + doc );
			return done(err, doc);
		});		
	});

	passport.use('login', new LocalStrategy({
		passReqToCallback : true
	}, function(req, username, password, done){

		var query = {'username': username};
	
		account.findOne(query, function(err, doc){	
				
			if(err)
				return done({error:true, data:false, message:err});				
			if(!doc){
				return done({error:true, data:false, message:'no existe el usuario'});
			}

			var _isValidPassword = isValidPassword(doc, password);
			
			if(!_isValidPassword){
				return done({error:true, data:false, message:'Usuario o password errado!'});
			}
			return done({error:false, data:doc, message:'Exito!'});
		});
	}));

	passport.use('signup', new LocalStrategy({
		passReqToCallback : true
	}, function(req, username, password, done){
		
		var query = {'username': username};

		account
			.findOne(query, function(err, doc){

				if(err){
					console.log('error')
					return done(true, null, 'error')
				}

				if(doc){
					console.log('Usuario ya existe')
					return done(true, null, 'Usuario ya existe')
				}else{

					var newUser = new account();

					newUser.name = req.body.name;
					newUser.username = username;
					newUser.password = createHash(password);					
					newUser.email = req.body.email;
					newUser.role = req.params.role;

					if(typeof req.body.company != 'undefined')
						newUser.company = req.body.company;
					
					newUser.save(function(err){
						if(err){
							done(true, null, 'Error al salvar!');
						}						
						return done(false, newUser, 'success');
					});

				}
			});
	}));

	return router;
};