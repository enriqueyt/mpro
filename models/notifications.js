var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var notification = new Schema({
	name : {
        type:String
    },
    text:{
        type:String
    }
}, {autoIndex:false});

module.exports = mongoose.model('notification', notification);