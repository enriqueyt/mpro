var Mongoose = require('mongoose');
var Functional = require('underscore');
var Utils = require('../libs/utils');

var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var roles = ['admin', 'adminCompany', 'adminBranchCompany', 'technician'];

var roleValues = {
	admin: 'Administrador',
	adminCompany: 'Administrador Empresa',
	adminBranchCompany: 'Administrador Sucursal',
	technician: 'Técnico'
};

var getRoleValues = function () {
	var values = Functional.reduce(roles, function (accumulator, role) {
		accumulator.push({id: role, value: roleValues[role]});
		return accumulator;
	}, []);

	return values;
};

var getRoleValue = function (role) {
	return roleValues[role];
};

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
			enum: roles
		},
		identifier: {
			type: String,
			default: Utils.createUniqueId('mpro-')
		},
		company: {
			type: Schema.Types.ObjectId,
			ref: 'entity'
		},
		image: {
			type: String
		},
		date: {
			type: Date,
			default: Date.now
		},
		status: {
			type: Boolean,
			default: true
		}
	},
	{
		autoIndex: false
	}
);

account.statics.getRoleValues = getRoleValues;

account.statics.getRoleValue = getRoleValue;

account.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
	var query = {username: self.username};

	model.find(query, function (err, documents) {
		if (documents.length === 0) {
			next();
		}
		else {
			next(new Error('Account already exists - Username: '.concat(self.username)));
		}
	});
});

module.exports = Mongoose.model('account', account);