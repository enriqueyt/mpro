var Mongoose = require('mongoose');
var _ = require('underscore');

var Utils = require('../../../libs/utils');
var Log = require('../../../libs/log');

var DATE_FORMAT = 'DD/MM/YYYY';

exports.getLogsViewData = function(req, res, next){
    if (!req.user) {
        console.log('No identifier found');
        res.redirect('/login');
    }

    if (req.user.role !== 'admin') {
        var message = 'Just for main administrators';
        throw new Error(message);
        return;
    }
    
    var accountPromise = new Promise(function (resolve, reject) {
        var identifier = req.user.identifier;
        var role = req.params.role || req.user.role;
        var username = req.user.username;
        var query = {'identifier': identifier, 'role': role, username: username};
        
        mongoAccount.findOne(query).exec()
        .then(function (user) {
            if (!user || user.length === 0) {
                var message = 'No user found';
                reject(new Error(message));
            }
            else {
                resolve(user);
            }
        })
        .catch(function (err) {
            reject(err);
        });
    });

    var onFetchLogs = function(user){
        return new Promise(function(resolve, reject){
            Log.getLogs(10,0).onFetchByRole(user)
            .then(function(data){    
                resolve({
                    user:user,
                    activity:data, 
                    offSet:data.length,
                    limit:10, 
                    skip:0
                });
            })
            .catch(reject);

        });
    };

    var onRender = function (data) {
        var tempUser = req.user||{};
        req.user={};
        return res.render('pages/dashboard/dashboard_admin', {
            user : tempUser,
            currentAccount: data.user,
            activity:data.activity,
            limit:10,
            skip:0
        });
    };

    accountPromise
        .then(onFetchLogs)
        .then(onRender)
        .catch(function (err) {
          console.log('ERROR:', err);
          res.redirect('/');
          return;
        });
};