const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  start: Date,
  end: Date,
  category: String,
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  maintenanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
  isAuto: { type: Boolean, default: false }
});

module.exports = mongoose.model('Event', eventSchema);
