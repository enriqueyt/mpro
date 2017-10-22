var Mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var sessionModel = Mongoose.model('session');

var sessionHandle = {
    createSession:function(user, done){
        bcrypt.hash(user.username, null, null, function(err, hash) {
            var _session={
                session:hash,
                user:user._id,
                active:1
            };

            var session_obj = new sessionModel(_session);

            var onCreateSesion=function(err, doc){
                if(err) return done(true)
                return done(false, _session);
            };

            session_obj.save(onCreateSesion);
        });
    },
    endSession:function(session_id, done){
        var query = {session:session_id},
            update = {active:false},
            option = {upsert:true};

        var onUpdateSession = function (err, document) {
            if (err || !document) {
              return done(true);
            }

            return done(false);
        };
                
        sessionModel.findOneAndUpdate(query, update, option, onUpdateSession);

    },
    isLoogged:function(req, res, next){
        var session_id=req.session._id;
        var validateSession = function(session, done){
            var query = {session:session, active:true}

            var execSession = function(data){
                //code out handle time up
                return done(false, data);
            };

            var excepSession = function(err){
                return done(true, err);
            };

            sessionModel
                .findOne(query)
                .populate('user')
                .exec()
                .then(execSession)
                .catch(excepSession);
        };

        validateSession(session_id, function(err, response){
            if(!err) req.user=response.user;
            return next();
        });
    }
};

module.exports = sessionHandle;