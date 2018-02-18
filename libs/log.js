var Mongoose = require('mongoose');
var moment = require('moment');
var ObjectId = Mongoose.Schema.Types.ObjectId;
var logModel = Mongoose.model('log');
var accountModel = Mongoose.model('account');
var entityModel = Mongoose.model('entity');
var _ = require('underscore');
var log = {};

log.debug = function(obj){
    return leaveLog('debug', obj);
};

log.info = function(obj){
    return leaveLog('info', obj);
};

log.error = function(obj){
    return leaveLog('error', obj);
};

var leaveLog = function(type, obj){
    return new Promise(function(resolve, reject){
        obj.level=type;
        onCreateLog(obj).then(resolve).catch(reject);
    });
};

log.getLogs = function(total, skip){

    var accountByCompanyPromise = function(user){
        return new Promise(function(resolve, reject){
            var query = {company:user.company._id};
                          
            accountModel
                .find(query)
                .then(function(data){
                    resolve(data)
                })
                .catch(reject);
        });
    };

    var branchEntityByEntity = function(user){
        return new Promise(function(resolve, reject){
            var query = {company:user.company._id};         
            entityModel
                .find(query)
                .then(function(data){            
                    var arr=[];
                    data.forEach(function(v,k){
                        arr.push(v._id);
                    });
                    resolve([arr, user]);
                })
                .catch(reject);
        });
    };

    var accountsByBranchCompany = function(obj){
        return new Promise(function(resolve, reject){
            var query = [{ 
                $match : {
                    'company' : { $in:obj[0] }
                }
            }];

            accountModel
                .aggregate(query)
                .exec()
                .then(function(data){
                    resolve([data, obj[1]])
                })
                .catch(reject);
        });
    };

    var getLogsByUsersId = function(ids){
        return new Promise(function(resolve, reject){

            var users = ids.map(function(o){return Mongoose.Types.ObjectId(o._id);});
            
            var query = {user: {$in: users}};

            logModel.find(query).exec()
            .then(function(data){
                resolve(data);
            })
            .catch(function(err){
                reject(data);
            });
        });
    };

    var accountsByCompany = function(data){
        return new Promise(function(resolve, reject){
            accountByCompanyPromise(data[1])
            .then(getArrQuery)
            .then(getLogsByUsersId)
            .then(function(data){
                console.log('accountsByCompany - accountByCompanyPromise - getLogsByUsersId')
                console.log(data.length)
                return resolve(data);
            })
            .catch(reject);
        });

        var getArrQuery = function(data){
            return new Promise(function(resolve, reject){
                var arr=[], aux=[];
                
                if(accounts.length>0){
                    aux=accounts.concat(data[0]);
                    aux.forEach(function(account){
                        if(account){
                            arr.push(account._id);
                        }
                    }, this);
                    return resolve(arr);
                }
                return reject([]);
            });
        }
    };

    var onFetchLogBySingleUser = function(user){
        return new Promise(function(resolve, reject){
            var query = {user:user._id};
            logModel
                .find(query)
                .sort({date:-1})
                .exec()
                .then(resolve)
                .catch(reject);
        });
    };

    var onFilterLogsByBranchCompany = function(user){
        return new Promise(function(resolve, reject){
            accountByCompanyPromise(user)            
            .then(function(accounts){
                var arr=[];
                accounts.forEach(function(account){
                    if(account){
                        arr.push(account._id);
                    }
                }, this);
                getLogsByUsersId(arr)
                .then(function(data){
                    resolve(data);
                });
            })
            .catch(function(err){
                reject(err);
            });
        });
    };

    var onFilterLogsByCompany = function(user){
        return new Promise(function(resolve, reject){
            branchEntityByEntity(user)
            .then(accountsByBranchCompany)
            .then(accountsByCompany)
            .then(function(data){
                return resolve(data);
            })
            .catch(function(data){
                return reject(data);
            });
        });
    };

    var onFetchAllLogs = function(){
        return new Promise(function(resolve, reject){
            logModel
            .find({})
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

    var onFetchByRole = function(user){
        return new Promise(function(resolve, reject){
            switch(user.role){
                case 'admin':
                    onFetchAllLogs().then(resolve).catch(reject);
                    break;
                case 'admin_company':
                    onFilterLogsByCompany(user).then(resolve).catch(reject);
                    break;
                case 'admin_branch_company':
                    onFilterLogsByBranchCompany(user).then(resolve).catch(reject);
                    break;
                case 'technical':
                    onFetchLogBySingleUser(user).then(resolve).catch(reject);
                    break;
            };
        });
    };

    return {
        onFetchByRole:onFetchByRole
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