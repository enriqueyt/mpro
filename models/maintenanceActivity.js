var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var maintenanceActivity = new Schema(
  {	
    name: {
      type: String,
      required: true		
    },
    description: {
      type: String
    },
    company: { 
      type: Schema.Types.ObjectId, 
      ref: 'entity',
      required: true
    },
    equipmentType: { 
      type: Schema.Types.ObjectId, 
      ref: 'equipmentType',
      required: true
    },
    status: {
      type: Boolean,
      default: true
    },
    deleted: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    autoIndex: false
  }
);

maintenanceActivity.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  var query = {name: self.name, company: self.company, equipmentType: self.equipmentType};

  model.find(query, function (err, documents) {
    if (documents.length === 0) {
      next();
    }
    else {
      // console.log('Maintenance activity exists: ', self.name, self.company, self.equipmentType);
      next(new Error(
        'Maintenance activity exists - Name: '.concat(
          self.name, ' Company: ', self.company, ' Equipment Type: ', self.equipmentType)));
    }
  });
});

module.exports = Mongoose.model('maintenanceActivity', maintenanceActivity);