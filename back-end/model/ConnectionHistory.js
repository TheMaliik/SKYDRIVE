const mongoose = require('mongoose');

const connectionHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // le modèle User
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  }
});

module.exports = mongoose.model('ConnectionHistory', connectionHistorySchema);
