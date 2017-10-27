var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Stall = new Schema({
  id: {type: Number,
    required: [true, 'Stall id field is required']
  },
  name: {
    type: String,
    required: [true, 'Stall name field is required']
  },
  parent_room: {
    type: String,
    required: [true, 'Parent Room id field is required']
  },
  used_today: Number,
  used_week: Number,
  status: String,
  battery: String,
  sensor_id: String,
  left: String,
  top: String
});

module.exports = mongoose.model('stalls', Stall);