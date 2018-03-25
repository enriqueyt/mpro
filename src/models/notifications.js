var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var ObjectId = Mongoose.Schema.Types.ObjectId;

var notification = new Schema(
  {
    name: {
      type: String
    },
    text: {
      type: String
    }
  },
  {
    autoIndex: false
  }
);

module.exports = Mongoose.model('notification', notification);