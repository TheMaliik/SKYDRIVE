const express = require("express");
const router = express.Router();
const Vehicule = require("../model/Vehicule");
const mongoose = require("mongoose");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");
const Notification = require("../model/Notification");


// Liste des marques et modèles disponibles en Tunisie
const carData = [
    { marque: "Renault", modeles: ["Clio", "Mégane", "Symbol", "Kwid", "Duster"] },
    { marque: "Peugeot", modeles: ["208", "301", "2008", "3008", "5008"] },
    { marque: "Hyundai", modeles: ["i10", "i20", "Accent", "Elantra", "Tucson"] },
    { marque: "Kia", modeles: ["Picanto", "Rio", "Cerato", "Sportage", "Sorento"] },
    { marque: "Toyota", modeles: ["Agya", "Yaris", "Corolla", "Hilux", "Land Cruiser"] },
    { marque: "Volkswagen", modeles: ["Polo", "Golf", "Passat", "Tiguan", "Touareg"] },
    { marque: "Citroën", modeles: ["C3", "C4", "C-Elysée", "Berlingo"] },
    { marque: "Suzuki", modeles: ["Celerio", "Swift", "Baleno", "Vitara", "Jimny"] },
    { marque: "Mitsubishi", modeles: ["Mirage", "Attrage", "L200", "Pajero"] },
    { marque: "Chery", modeles: ["Tiggo 1X", "Tiggo 3X", "Arrizo 5"] },
    { marque: "Dacia", modeles: ["Logan", "Sandero", "Duster"] },
    { marque: "Fiat", modeles: ["Panda", "Tipo", "500", "Doblo"] },
    { marque: "Ford", modeles: ["Fiesta", "Focus", "Kuga", "Ranger"] },
    { marque: "Nissan", modeles: ["Micra", "Sunny", "Qashqai", "X-Trail"] },
    { marque: "Mazda", modeles: ["Mazda 2", "Mazda 3", "CX-5"] },
    { marque: "Honda", modeles: ["Jazz", "Civic", "CR-V"] },
    { marque: "Jeep", modeles: ["Renegade", "Compass", "Cherokee"] },
    { marque: "BMW", modeles: ["Série 1", "Série 3", "X1", "X3"] },
    { marque: "Mercedes-Benz", modeles: ["Classe A", "Classe C", "GLA", "GLC"] },
    { marque: "Audi", modeles: ["A3", "A4", "Q3", "Q5"] },
    { marque: "Skoda", modeles: ["Fabia", "Octavia", "Karoq", "Kodiaq"] },
    { marque: "Seat", modeles: ["Ibiza", "Leon", "Arona", "Ateca"] },
    { marque: "Geely", modeles: ["GX3 Pro", "Emgrand"] },
    { marque: "Mahindra", modeles: ["KUV100", "XUV300", "Pik-Up"] },
    { marque: "Changan", modeles: ["Alsvin", "CS35 Plus", "Eado"] },
    { marque: "DFSK", modeles: ["Glory 580", "K01S"] },
    { marque: "Wallyscar", modeles: ["Iris", "719"] }
];

// Fonction pour valider la marque et le modèle d'une voiture
const isValidCar = (marque, modele) => {
    const brand = carData.find(item => item.marque === marque);
    return brand && brand.modeles.includes(modele);
};

// Ajouter un véhicule
router.post("/", [
    body('marque').notEmpty().withMessage('Marque est obligatoire'),
    body('modele').notEmpty().withMessage('Modèle est obligatoire'),
    body('immatriculation')
        .matches(/^[0-9]{3}TUN[0-9]{4}$/)
        .withMessage("L'immatriculation doit être au format XXX-TUN-YYYY"),
    body('annee').isInt().withMessage('L\'année doit être un nombre valide'),
    body('kilometrage').isInt().withMessage('Kilométrage doit être un nombre valide'),
    body('prixParJour').isFloat().withMessage('Prix par jour doit être un nombre valide'),
    body('assurance').isISO8601().withMessage('Date d\'assurance invalide'),
    body('carburant').isIn(['Essence', 'Diesel', 'Hybride', 'Electrique']).withMessage('Type de carburant invalide'),
    body('statut').optional().isIn(['Disponible', 'Loué', 'En maintenance', 'En panne', 'Accidenté', 'Indisponible'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { marque, modele } = req.body;

    // Vérifier si la marque et le modèle sont valides
    const isValid = isValidCar(marque, modele);
    if (!isValid) {
        return res.status(400).json({ message: `Le modèle ${modele} n'existe pas pour la marque ${marque}` });
    }

    const vehiculeExistant = await Vehicule.findOne({ immatriculation: req.body.immatriculation });
    if (vehiculeExistant) {
        return res.status(400).json({ message: "Ce véhicule existe déjà" });
    }

    const newVehicule = new Vehicule(req.body);
    await newVehicule.save();
    const notification = new Notification({
        message: `Un nouveau véhicule a été ajouté : ${newVehicule.marque} ${newVehicule.modele}`,
    });
    await notification.save();
    res.status(201).json(newVehicule);
}));

// Route pour récupérer tous les véhicules
router.get("/", async (req, res) => {
    try {
        const vehicules = await Vehicule.find();
        res.json(vehicules);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des véhicules" });
    }
});

// Route pour récupérer les modèles par marque
router.get('/modele/:marque', async (req, res) => {
    const { marque } = req.params;

    if (!marque || marque.trim().length < 2) {
        return res.status(400).json({ message: "Marque invalide ou trop courte" });
    }

    try {
        const brand = carData.find(item => item.marque.toLowerCase() === marque.toLowerCase());
        if (!brand) {
            return res.status(400).json({ message: "Marque introuvable" });
        }
        res.json(brand.modeles);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des modèles" });
    }
});
// Route pour récupérer les notifications
router.get("/notifications", async (req, res) => {
    try {
        const notifications = await Notification.find({ seen: false }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des notifications" });
    }
});

// Mettre à jour un véhicule
router.put("/:id", [
    body('marque').optional().notEmpty().withMessage('Marque est obligatoire'),
    body('modele').optional().notEmpty().withMessage('Modèle est obligatoire'),
    body('immatriculation')
    .optional()
    .matches(/^[0-9]{3}TUN[0-9]{4}$/)
    .withMessage("L'immatriculation doit être au format 123TUN456"),
    body('annee').optional().isInt().withMessage('L\'année doit être un nombre valide'),
    body('kilometrage').optional().isInt().withMessage('Kilométrage doit être un nombre valide'),
    body('prixParJour').optional().isFloat().withMessage('Prix par jour doit être un nombre valide'),
    body('assurance').optional().isISO8601().withMessage('Date d\'assurance invalide'),
    body('carburant').optional().isIn(['Essence', 'Diesel', 'Hybride', 'Electrique']).withMessage('Type de carburant invalide'),
    body('statut').optional().isIn(['Disponible', 'Loué', 'En maintenance', 'En panne', 'Accidenté'])
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("ERREUR DE VALIDATION ");
        console.log("URL:", req.originalUrl);
        console.log("Méthode:", req.method);
        console.log("Body envoyé:", req.body);
        console.log("Erreurs de validation:", errors.array());
        
        return res.status(400).json({ 
            message: "Données invalides",
            errors: errors.array(),
            receivedData: req.body 
        });
    }
    const { id } = req.params;
    const updatedData = req.body;

    // Vérifier si le véhicule existe
    const vehicule = await Vehicule.findById(id);
    if (!vehicule) {
        return res.status(404).json({ message: "Véhicule non trouvé" });
    }

    // Vérification et mise à jour des données de marque et modèle
    if (updatedData.marque || updatedData.modele) {
        const { marque, modele } = updatedData;
        const brand = carData.find(item => item.marque === marque);
        if (brand && !brand.modeles.includes(modele)) {
            return res.status(400).json({ message: `Modèle ${modele} non valide pour la marque ${marque}` });
        }
    }

    // Mettre à jour le véhicule
Object.assign(vehicule, updatedData);
await vehicule.save();

// ➔ Ajouter la notification de modification
const notification = new Notification({
    message: `Le véhicule ${vehicule.marque} ${vehicule.modele} a été modifié.`,
});
await notification.save();

res.status(200).json(vehicule);

}));

// Route pour supprimer un véhicule
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const vehicule = await Vehicule.findByIdAndDelete(id);
        if (!vehicule) {
            return res.status(404).json({ message: "Véhicule non trouvé" });
        }
    
        // ➔ Ajouter la notification de suppression
        const notification = new Notification({
            message: `Le véhicule ${vehicule.marque} ${vehicule.modele} a été supprimé.`,
        });
        await notification.save();
    
        res.status(200).json({ message: "Véhicule supprimé avec succès" });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la suppression du véhicule" });
    }
    
});

module.exports = router;