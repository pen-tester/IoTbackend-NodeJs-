var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Event = new Schema({
  sensor_id: {
    type: String,
    required: [true, 'sensor id field is required']
  },
  timestamp: {
    type: Date,
    required: [true, 'timestamp field is required']
  },
  event: Number
});

module.exports = mongoose.model('events', Event);