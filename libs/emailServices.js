var exports = module.exports={};

var sendindBlue = require('sib-api-v3-sdk');
var defaultClient = sendindBlue.ApiClient.instance;

var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = 'YOUR_API_V3_KEY';

var apiInstance = new sendindBlue.EmailCampaignsApi();
var emailCampaigns = new sendindBlue.CreateEmailCampaign();

function sendEmail(option){
    if(!option.to){
        throw new Error('');
    }
    if(!option.subject){
        throw new Error('');
    }
    if(!option.text){
        throw new Error('');
    }

    apiInstance.CreateEmailCampaign(option)
    .then(function(data){
        console.log('data: ', data);
        return data;
    }, function(error){
        console.log('error',);
        return error;
    })

};
