var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Floor = new Schema({
  name: {
    type: String,
    required: [true, 'Floor name field is required']
  },
  parent_venue: {
    type: String,
    required: [true, 'Parent venue id field is required']
  },
  floor_id: {
    type: String,
    required: [true, 'Floor Identifier field is required']
  },
  created: {
    type: Date,
    required: [true, 'Created field is required']
  },
  description: String,
  total_stalls: Number,
  available_stalls: Number,
  available_percent: Number,
  avg_vacant_time: Number,
  vacant_time_percent: Number,
  needs_attention: Number,
  available_fromlastweek: Number,
  available_now: Number
});

module.exports = mongoose.model('floors', Floor);