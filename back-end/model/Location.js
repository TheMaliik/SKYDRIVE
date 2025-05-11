const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  vehiculeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Vehicule', 
    required: true 
  },
  clientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  startDateEffective: Date,
  prixTTC: { 
    type: Number, 
    required: true 
  },
  garantie: { 
    type: Number 
  },
  statut: { 
    type: String, 
    enum: ['active', 'terminée'], 
    default: 'active' 
  },
  kilometrageInitial: { 
    type: Number 
  },
  kilometrageFinal: { 
    type: Number 
  },
  distanceParcourue: { 
    type: Number 
  },
  maintenanceAlert: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    default: null 
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', LocationSchema);
