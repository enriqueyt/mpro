var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var account = new Schema({
	name : String,
	username : {
		type: String,
		required: true,
		unique:true,
		lowercase:true
	},
	password:{
		type : String,
		required : true
	},
	email :{
		type : String
	},
	role : { 
        type:String, 
        enum: ['admin', 'admin_company', 'admin_branch_company', 'technical'] 
    },
    identifier : {
		type: String,
		default: function(){
            var code = "mpro-";
            for(var i = 0; i < 1; i++){
                code = code + Math.random().toString(36).substring(10);
            }
            return code;
        }
	},
    company: ObjectId, //hace referencia a que company o branch_company esta asignado. Depende del rol asisnado
    image: [{
        filename : String,
        imageurl : String
    }],
	date : {
		type: Date,
		default: Date.now
	}

}, {autoIndex:false});

account.pre('save', function(next){
    var self = this;
    var model = self.model(self.constructor.modelName);    
    console.log(model);
    // enviar el correo antes de que se cree un usuario
    next();
});

module.exports = mongoose.model('account', account);