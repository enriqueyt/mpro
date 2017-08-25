var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var createDefaultIdentifier = function () {
  var code = 'mpro-';

  for (var i = 0; i < 1; i += 1) {
    code = code.concat(Math.random().toString(36).substring(10));
  }

  return code;
}

var account = new Schema({
	name: {
    type: String
  },
	username : {
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
	role : { 
    type:String, 
    enum: ['admin', 'admin_company', 'admin_branch_company', 'technical'] 
  },
  identifier : {
    type: String,
		default: createDefaultIdentifier()
	},
  company: {
		type: Schema.Types.ObjectId,
    ref: 'entity'
	},
  image: [{
    filename: String,
    imageUrl: String
  }],
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
});

account.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before user creation was made.
  next();
});

module.exports = mongoose.model('account', account);