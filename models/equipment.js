var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var equipment = new Schema({
	name: {
		type: String,
    required: true
	},
	location: {
		type: String
	},
  category: {
    type: String
  },
	code: {
		type: String,
		required: true
	},
  company: {
    type: Schema.Types.ObjectId,
    ref: 'entity'
  },
  image: [{
    filename: String,
    imageUrl: String
  }],
  maintenances_date: [
    Date
  ],
  date: {
    type: Date
  },
  userAssigned: {
    type: Schema.Types.ObjectId,
    ref: 'account'
  }
},
{
  autoIndex: false
});

company.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before equipment creation was made.
  next();
});

module.exports = Mongoose.model('equipment', equipment);