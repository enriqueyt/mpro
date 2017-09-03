var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var equipmentType = new Schema(
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
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    autoIndex: false
  }
);

equipmentType.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);    
  console.log(model);
  // Sends mail before equipmentType creation was made.
  next();
});

module.exports = Mongoose.model('equipmentType', equipmentType);