var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var entity = new Schema({
	name: {
		type: String	
	},
	location: {
		type: String	
	},	
	email: {
		type: String
	},
  phone: {
		type: String	
	},
  type: {
    type: String,
    enum: ['company', 'branch_company']
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: 'entity'
  },
  date: {
    type: Date
  }
},
{
  autoIndex: false
});

entity.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before entity creation was made.
  next();
});

module.exports = Mongoose.model('entity', entity);