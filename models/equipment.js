var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var equipment = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    location: {
      type: String
    },
    equipmentType: {
      type: Schema.Types.ObjectId,
      ref: 'equipmentType',
      required: true
    },
    branchCompany: {
      type: Schema.Types.ObjectId,
      ref: 'entity',
      required: true
    },
    image: [
      {
        filename: String,
        imageUrl: String
      }
    ],
    maintenanceActivityDates: [
      {
        date: Date,
        identifier: String
      }
    ],
    date: {
      type: Date,
      default: Date.now
    },
    userAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'account',
      required: true
    }
  },
  {
    autoIndex: false
  }
);

equipment.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before equipment creation was made.
  next();
});

module.exports = Mongoose.model('equipment', equipment);