const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  periode: {
    type: String, // Ex: "04-2025" ou "Année-2025"
    required: true
  },
  totalRevenus: {
    type: Number,
    required: true
  },
  totalDepenses: {
    type: Number,
    required: true
  },
  resultatNet: {
    type: Number,
    required: true
  },
  detailsRevenus: [
    {
      location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
      montant: Number
    }
  ],
  detailsDepenses: [
    {
      maintenance: { type: mongoose.Schema.Types.ObjectId, ref: 'Maintenance' },
      montant: Number
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Finance', financeSchema);
