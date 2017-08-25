var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var activities_maintenance = new Schema({	
	name: {
		type: String,
		required: true		
	},
	description: {
		type: String
	},
	checked: {
		type: Boolean,
    default: false
	},
	equipment: { 
    type:Schema.Types.ObjectId, 
    ref: 'equipment'
  },
  date: {
    type: Date
  }
},
{
  autoIndex: false
});

activities_maintenance.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before activity maintenance creation was made.
  next();
});

module.exports = mongoose.model('activities_maintenance', activities_maintenance);