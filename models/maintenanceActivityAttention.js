var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var maintenanceActivityAttention = new Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    checked: {
      type: Boolean,
      default: false
    },
    maintenanceActivity: { 
      type: Schema.Types.ObjectId, 
      ref: 'maintenanceActivity',
      required: true
    },
    equipment: { 
      type: Schema.Types.ObjectId, 
      ref: 'equipment',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    finishDate: {
      type: Date
    }
  },
  {
    autoIndex: false
  }
);

maintenanceActivityAttention.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);
  var query = {maintenanceActivity: self.maintenanceActivity, equipment: self.equipment, date: self.date};

  model.find(query, function (err, documents) {
    if (documents.length === 0) {
      next();
    }
    else {
      // console.log('Maintenance activity attention exists: ', self.maintenanceActivity, self.equipment, self.date);
      next(new Error(
        'Maintenance activity attention exists - MaintenanceActivity: '.concat(
          self.maintenanceActivity, ' Equipment: ', self.equipment, ' Date: ', self.date)));
    }
  });
});

module.exports = Mongoose.model('maintenanceActivityAttention', maintenanceActivityAttention);