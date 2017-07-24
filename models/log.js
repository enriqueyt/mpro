var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var log = new Schema({
	text : {
        type:String
    },
	type : { //al realizar algun crud ej: create_account, delete_activities...
		type: String
	},
	user:{
		type : Schema.Types.ObjectId,
		ref : 'account'
	},
    date:{
        type:Date,
        default:Date.now
    }
}, {autoIndex:false});

module.exports = mongoose.model('log', log);