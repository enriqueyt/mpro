var exports = module.exports={};

var nodemailer = require('nodemailer');

var transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'mproservice123@gmail.com',
        pass: 'mproservice123456'
    }
});

function sendEmail(option, callback){

    option.from='mproservice123@gmail.com';

    if(!option.to){
        throw new Error('');
    }
    if(!option.subject){
        throw new Error('');
    }
    if(!option.text){
        throw new Error('');
    }

    transport.sendMail(option, function(err, data){
        if(err){
            console.log('err: ', err);
            callback(true, err);
            return;
        };
        return callback(false, data);
    });

};

exports.send = function(options){    
    return new Promise(function(resolve, reject){
        sendEmail(options, function(err, data){            
            if(err){
                reject(data);
                return;
            };
            return resolve(data);
        });
    });
};
