var Mongoose = require('mongoose');
var Utils = require('../libs/utils');

var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var account = new Schema(
	{
		name: {
			type: String
		},
		username: {
			type: String,
			required: true,
			unique: true,
			lowercase: true
		},
		password: {
			type: String,
			required: true
		},
		email: {
			type: String
		},
		role: { 
			type: String, 
			enum: ['admin', 'admin_company', 'admin_branch_company', 'technician'] 
		},
		identifier: {
			type: String,
			default: Utils.createUniqueId('mpro-')
		},
		company: {
			type: Schema.Types.ObjectId,
			ref: 'entity'
		},
		image: [
			{
				filename: String,
				imageUrl: String
			}
		],
		date: {
			type: Date,
			default: Date.now
		},
		status: {
			type: Boolean,
			default: false
		}
	},
	{
		autoIndex: false
	}
);

account.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before user creation was made.
  next();
});

module.exports = Mongoose.model('account', account);