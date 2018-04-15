var exports = module.exports={};

var sendGrid = require('@sendgrid/mail');
sendGrid.setApiKey('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');

var from = 'enriqueyt@gmail.com';

function sendEmail(option, callback){
    if(!option.to){
        throw new Error('');
    }
    if(!option.subject){
        throw new Error('');
    }
    if(!option.text){
        throw new Error('');
    }

    sendGrid.send({
        to:option.to,
        from:'enriqueyt@gmail.com',
        subject:option.subject,
        text:option.text
    }, function(err, data){
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
