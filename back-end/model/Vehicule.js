const mongoose = require("mongoose");

const vehiculeSchema = new mongoose.Schema({
    marque: { type: String, required: true },
    modele: { type: String, required: true },
    immatriculation: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    annee: { 
        type: Number, 
        required: true, 
        min: [2010, 'L\'année doit être supérieure ou égale à 2010'],
        max: [new Date().getFullYear(), 'L\'année ne peut pas être dans le futur']
    },
    kilometrage: { 
        type: Number, 
        required: true, 
        index: true, 
        min: [0, 'Le kilométrage ne peut pas être négatif'] 
    },
    
    dernierKilometrageVidange: {
        type: Number,
        default: 0,
        min: [0, 'Le kilométrage ne peut pas être négatif']
    },
    
    statut: { 
        type: String, 
        enum: ['Disponible', 'Loué', 'En maintenance', 'En panne', 'Accidenté'], 
        default: 'Disponible' 
    },
    
    carburant: { 
        type: String, 
        enum: ['Essence', 'Diesel', 'Hybride', 'Electrique'], 
        required: true 
    },
    assurance: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(value) {
                // Autoriser une marge de 30 jours dans le passé
                const todayMinus30 = new Date();
                todayMinus30.setDate(todayMinus30.getDate() - 30);
                return value >= todayMinus30;
            },
            message: 'La date d\'assurance ne peut pas être trop ancienne (plus de 30 jours dans le passé).'
        }
    },
   
    prixParJour: { 
        type: Number, 
        required: true, 
        min: [0, 'Le prix par jour ne peut pas être négatif']
    },
    raisonPanne: { 
        type: String,
        validate: {
            validator: function(value) {
                if (value && !this.dateReparation) {
                    return false;
                }
                return true;
            },
            message: 'La date de réparation doit être renseignée si une raison de panne est fournie.'
        }
    },
   
    locationHistory: [{
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
        startDate: { 
            type: Date, 
            required: true,
            validate: {
                validator: function(value) {
                    return value >= new Date();
                },
                message: 'La date de début de la location ne peut pas être dans le passé.'
            }
        },
        endDate: { 
            type: Date, 
            required: true 
        },
        prixTotal: { 
            type: Number, 
            required: true,
            min: [0, 'Le prix total ne peut pas être négatif'] 
        }
    }]
}, { timestamps: true });

// Index supplémentaires pour accélérer les requêtes
vehiculeSchema.index({ immatriculation: 1, statut: 1 });
vehiculeSchema.index({ carburant: 1, annee: -1 });
vehiculeSchema.index({ statut: 1, marque: 1 });

const Vehicule = mongoose.model("Vehicule", vehiculeSchema);

module.exports = Vehicule;
