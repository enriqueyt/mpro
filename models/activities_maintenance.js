var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var activities_maintenance = new Schema({	
	name : {
		type: String,
		required: true		
	},
	description:{
		type : String
	},
	cheched :{
		type : Boolean,
        default:false
	},
	equipo : { 
        type:Schema.Types.ObjectId, 
        ref: 'equipo'
    },
    date:{
        type:Date
    }
}, {autoIndex:false});

activities_maintenance.pre('save', function(next){
    var self = this;
    var model = self.model(self.constructor.modelName);    
    console.log(model);
    // enviar el correo antes de que se cree un usuario
    next();
});

module.exports = mongoose.model('activities_maintenance', activities_maintenance);