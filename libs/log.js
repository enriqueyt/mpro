var Mongoose = require('mongoose');
var moment = require('moment');
var ObjectId = Mongoose.Schema.Types.ObjectId;
var logModel = Mongoose.model('log');
var accountModel = Mongoose.model('account');
var _ = require('underscore');
var log = {};

log.debug = function(obj, done){
    obj.level='debug';
    onCreateLog(obj)
    .then(done)
    .catch(done);
};

log.info = function(obj, done){
    obj.level='info';
    onCreateLog(obj)
    .then(function(data){
        done(data);
    });
};

log.error = function(obj, done){
    obj.level='error';
    onCreateLog(obj)
    .then(function(data){
        done(data);
    });
};

log.getLogs = function(total, skip){
    
    var accountPromise = new Promise(function(reject, resolve){
        var query = {company:new ObjectId(user.company)};
        accountModel
            .find(query, {_id:1})
            .then(function(accounts){
                resolve(accounts);
            })
            .catch(function(err){
                reject(err);
            });
    });

    var getLogBySingleUser = function(user){
        return new Promise(function(resolve, reject){
            var query = {user:user._id};
            logModel
                .find(query)
                .sort({date:-1})
                .exec()
                .then(function(logs){
                    resolve(logs);
                })
                .catch(function(err){
                    reject(err);
                });
        });
    };

    var getLogsByUsersId = function(ids){
        return new Promise(function(reject, resolve){
            var query = [{ 
				$match : {
					'_id' :{$in:ids}
				}
			}];
            
            logModel
                .aggregate(query)
                .exec()
                .then(function(logs){
                    resolve(logs);
                })
                .catch(function(err){
                    reject(err);
                });

        });
    };

    var getLogByBranchCompany = function(){
        
        return new Promise(function(reject, resolve){
            accountPromise
                .then(function(accounts){
                    var arr=[];
                    accounts.forEach(function(account) {
                        if(account)
                            arr.push(account._id);
                    }, this);
                    getLogsByUsersId(arr).then(resolve);
                })
                .catch(function(err){
                    reject(err);
                });
        });

    };

    var getLogsByCompany = function(){
        return new Promise(function(reject, resolve){
            accountPromise
                .then(function(accounts){
                    var companyIds = _.groupBy(accounts, function(account){
                        return account.company;
                    });
                    console.log(companyIds);
                })
                .catch(function(err){
                    reject(err);
                });
        });
    };

    var getLogsByRole = function(user, done){
        switch(user.role){
            case 'admin':
                break;
            case 'admin_company':
                break;
            case 'admin_branch_company':
                getLogByBranchCompany(user).then(done);
                break;
            case 'technical':
                getLogBySingleUser(user).then(done);
                break;
        };
    };

    return {
        getLogBySingleUser: getLogBySingleUser,
        getLogByBranchCompany: getLogByBranchCompany,
        getLogsByCompany: getLogsByCompany
    }
};

function onCreateLog(obj){
    return new Promise(function(resolve, reject){
        var log = new logModel(obj);
        log.save(function(err, doc){
            if(err) return reject(err);
            return resolve(doc);
        });
    });
};

module.exports = log;