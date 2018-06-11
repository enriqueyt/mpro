var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var notification = new Schema({    
    equipment: {
      type: Schema.Types.ObjectId,
      ref: 'equipment',
      required: true
    },
    date:{
      type: Date
    }
  },
  {
    autoIndex: false
  }
);

module.exports = Mongoose.model('notification', notification);