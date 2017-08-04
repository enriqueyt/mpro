var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var equipo = new Schema({
	name : {
		type: String,
        required:true
	},
	location : {
		type: String
	},
    category:{
        type:String
    },
	code:{
		type : String,
		required : true
	},
    company: {
        type:Schema.Types.ObjectId,
        ref:'entity'
    },
    image: [{
        filename : String,
        imageurl : String
    }],
    maintenances_date:[Date],
    date:{
        type:Date
    },
    userasigned:{
        type:Schema.Types.ObjectId,
        ref:'account'
    }
}, {autoIndex:false});

company.pre('save', function(next){
    var self = this;
    var model = self.model(self.constructor.modelName);    
    console.log(model);
    // enviar el correo antes de que se cree un usuario
    next();
});

module.exports = mongoose.model('equipo', equipo);