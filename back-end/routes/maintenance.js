const express = require("express");
const router = express.Router();
const Maintenance = require("../model/maintenance");
const Vehicule = require("../model/Vehicule");
const Event = require("../model/Event"); 

// Route pour ajouter une maintenance
router.post("/", async (req, res) => {
    try {
        const { date, date_realisée, type, description, cout, vehicule } = req.body;

        // Vérifier si le véhicule existe
        const vehiculee = await Vehicule.findById(vehicule);
        if (!vehiculee) {
            return res.status(404).json({ message: "Véhicule non trouvé" });
        }

        // Créer une nouvelle maintenance
        const newMaintenance = new Maintenance({
            date,
            date_realisée,  // Ajout de la date réalisée
            type,
            description,    // Ajout de la description
            cout,
            vehicule: vehiculee,
        });

        // Sauvegarder la maintenance
        await newMaintenance.save();

        // Si c'est une vidange, enregistrer le kilométrage actuel
        if (type.toLowerCase() === "vidange") {
            vehiculee.dernierKilometrageVidange = vehiculee.kilometrage;
        }

        // Mettre à jour l'état du véhicule
        vehiculee.statut = "En maintenance";
        vehiculee.maintenance = date;
        await vehiculee.save();

        // Créer automatiquement un événement pour le calendrier
        await Event.create({
            title: `Maintenance : ${vehiculee.marque} ${vehiculee.modele} (${vehiculee.immatriculation})`,
            start: date,
            end: date,
            category: "maintenance"
        });

        // Retourner la maintenance nouvellement créée
        res.status(201).json(newMaintenance);

    } catch (error) {
        console.error("Erreur lors de l'ajout de la maintenance :", error);
        res.status(500).json({ error: "Erreur lors de l'ajout de la maintenance" });
    }
});

// Nouvelle route pour vérifier les vidanges nécessaires
router.get("/vidange-necessaire", async (req, res) => {
    try {
        const vehicules = await Vehicule.find({
            $expr: {
                $gte: [
                    { $subtract: ["$kilometrage", "$dernierKilometrageVidange"] },
                    10000
                ]
            }
        });

        res.json({
            count: vehicules.length,
            vehicules: vehicules.map(v => ({
                id: v._id,
                marque: v.marque,
                modele: v.modele,
                immatriculation: v.immatriculation,
                kilometrage: v.kilometrage,
                dernierKilometrageVidange: v.dernierKilometrageVidange,
                kilometresDepuisVidange: v.kilometrage - v.dernierKilometrageVidange
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Récupérer toutes les maintenances
router.get("/", async (req, res) => {
    try {
        const maintenances = await Maintenance.find().populate("vehicule");
        res.json(maintenances);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
});

// Route pour récupérer une maintenance par ID
router.get("/:id", async (req, res) => {
    try {
        console.log("Recherche de maintenance avec ID:", req.params.id);
        const maintenance = await Maintenance.findById(req.params.id).populate("vehicule");
        
        if (!maintenance) {
            console.log("Maintenance non trouvée:", req.params.id);
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }
        
        res.json(maintenance);
    } catch (error) {
        console.error("Erreur lors de la recherche de maintenance:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});
// Route pour supprimer une maintenanc
router.delete("/:id", async (req, res) => {
    try {
        const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
        
        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }
        
        res.status(200).json({ message: "Maintenance supprimée" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});
// routes/maintenance.js
// Route pour terminer une maintenance
router.put('/terminer/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            return res.status(400).json({ message: "Maintenance ID is required" });
        }

        // Mettre à jour la maintenance : changer le statut et ajouter la date de réalisation
        const maintenance = await Maintenance.findByIdAndUpdate(
            req.params.id,
            { 
                date_realisée: new Date(), // Ajouter la date de réalisation
                statut: "Terminée" // Changer le statut de la maintenance
            },
            { new: true }
        ).populate("vehicule");

        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }

        // Si la maintenance est liée à un véhicule, mettre à jour le statut du véhicule
        if (maintenance.vehicule) {
            const vehicule = await Vehicule.findById(maintenance.vehicule._id);
            if (vehicule) {
                vehicule.statut = "Disponible"; // Le véhicule est maintenant disponible
                await vehicule.save();
            }
        }

        // Retourner la maintenance mise à jour
        res.status(200).json(maintenance);
    } catch (error) {
        console.error("Error terminating maintenance:", error);
        res.status(500).json({ 
            message: "Erreur serveur lors de la terminaison de la maintenance",
            error: error.message 
        });
    }
});

module.exports = router;