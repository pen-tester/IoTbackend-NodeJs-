var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Room = new Schema({
  name: {
    type: String,
    required: [true, 'Room name field is required']
  },
  parent_floor: {
    type: String,
    required: [true, 'Parent Floor id field is required']
  },
  id: Number, //room number
  room_id: {
    type: String,
        required: [true, 'Room Identifier field is required']
  },
  created: {
    type: Date,
    required: [true, 'Created field is required']
  },
  description: String,
  room_type: String,
  total_stalls: Number,
  available_stalls: Number,
  available_percent: Number,
  avg_vacant_time: Number,
  vacant_time_percent: Number,
  needs_attention: Number,
  available_fromlastweek: Number,
  available_now: Number,
  map_file: String,
  map_width: Number,
  map_height: Number
});

module.exports = mongoose.model('rooms', Room);