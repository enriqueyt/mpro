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

equipmentType.pre('save', function (next) {
  var self = this;
  var model = self.model(self.constructor.modelName);
  var query = {name: self.name, company: self.company};
  
  model.find(query, function (err, documents) {
    if (documents.length === 0) {
      next();
    }
    else {
      next(new Error(
        'Equipment type exists - Name: '.concat(self.name, ' Company: ', self.company)
      ));
    }
  });
});

module.exports = Mongoose.model('equipmentType', equipmentType);