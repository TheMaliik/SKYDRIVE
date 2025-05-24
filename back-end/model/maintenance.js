const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    type: { type: String, required: true },
    cout: { type: Number, required: true },
    kilometrage: { type: Number }, 
    description: { type: String },
    garage: { type: String },      
    notes: { type: String },
    vehicule: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicule", required: true },
});

module.exports = mongoose.model("Maintenance", maintenanceSchema);
