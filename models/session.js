var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;
var moment = require('moment');

var session = new Schema({
		session: {
			type:String,		
		},
		user:{
			type: Schema.Types.ObjectId,
			ref: 'account'
		},
		expire: {
			type:Date,
			default:moment().add(60,'minute')
		},
		active:{
			type:Boolean,
			default:true
		}
	},{
		autoIndex: false
	}
);

module.exports = Mongoose.model('session', session);