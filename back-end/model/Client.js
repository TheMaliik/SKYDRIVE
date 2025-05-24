const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    CIN: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /^\d{8}$/, 
        minlength: 8, 
        maxlength: 8 
    },
    telephone: { type: String, required: true }, 
    ville: { type: String, required: true }, 
    nombreLocations: { type: Number, default: 0 },
    fidelityStatus: { 
        type: String, 
        enum: ['Non fidélisé', '10% de remise', '20% de remise', 'VIP'], 
        default: 'Non fidélisé' 
    },
    blacklisted: { type: Boolean, default: false } 
});

module.exports = mongoose.model('Client', clientSchema);
