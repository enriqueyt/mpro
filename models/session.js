var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var session = new Schema({
	session : {
		type: String,		
	},
	expire : {
		type: Date,
        default: Date.now
	}
}, {autoIndex:false});

module.exports = mongoose.model('session', session);