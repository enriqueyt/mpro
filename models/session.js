var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var session = new Schema({
	session: {
		type: String,		
	},
	expire: {
		type: Date,
    default: Date.now
	}
},
{
  autoIndex: false
});

module.exports = Mongoose.model('session', session);