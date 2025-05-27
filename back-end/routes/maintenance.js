const express = require("express");
const router = express.Router();
const Maintenance = require("../model/maintenance");
const Vehicule = require("../model/Vehicule");
const Event = require("../model/Event");

// Route pour ajouter une maintenance
router.post("/", async (req, res) => {
    try {
        const { date, date_realisée, type, description, cout, vehicule } = req.body;

        // Vérifier que tous les champs nécessaires sont présents
        if (!date || !type || !vehicule) {
            return res.status(400).json({ message: "Champs obligatoires manquants" });
        }

        // Vérifier si le véhicule existe
        const vehiculee = await Vehicule.findById(vehicule);
        if (!vehiculee) {
            return res.status(404).json({ message: "Véhicule non trouvé" });
        }

        // Créer une nouvelle maintenance
        const newMaintenance = new Maintenance({
            date,
            date_realisée,
            type,
            description,
            cout,
            vehicule: vehiculee,
            statut: "En attente"
        });

        // Si c'est une vidange, mettre à jour le dernier kilométrage
        if (type.toLowerCase() === "vidange") {
            vehiculee.dernierKilometrageVidange = vehiculee.kilometrage;
        }

        // Mettre à jour l'état du véhicule
        vehiculee.statut = "En maintenance";
        await vehiculee.save();

        // Sauvegarder la maintenance
        await newMaintenance.save();

        // Créer un événement pour le calendrier
        await Event.create({
            title: `Maintenance : ${vehiculee.marque} ${vehiculee.modele} (${vehiculee.immatriculation})`,
            start: date,
            end: date,
            category: "maintenance"
        });

        res.status(201).json(newMaintenance);

    } catch (error) {
        console.error("Erreur lors de l'ajout de la maintenance :", error);
        res.status(500).json({ error: "Erreur lors de l'ajout de la maintenance" });
    }
});

// Route pour récupérer toutes les maintenances
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
        const maintenance = await Maintenance.findById(req.params.id).populate("vehicule");
        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }
        res.json(maintenance);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Route pour supprimer une maintenance
router.delete("/deletemaintenance/:id", async (req, res) => {
    try {
        const maintenance = await Maintenance.findByIdAndDelete(req.params.id);

        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }

        // Supprimer l'événement lié si trouvé
        await Event.deleteOne({
            title: new RegExp(maintenance.vehicule?.immatriculation || "", "i"),
            start: maintenance.date
        });

        res.status(200).json({ message: "Maintenance et événement associés supprimés" });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Route pour mettre à jour une maintenance
router.put("/:id", async (req, res) => {
    try {
        const maintenanceId = req.params.id;
        const updatedData = req.body;

        const maintenance = await Maintenance.findById(maintenanceId);
        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }

        Object.assign(maintenance, updatedData);
        const updatedMaintenance = await maintenance.save();

        res.status(200).json(updatedMaintenance);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la maintenance" });
    }
});

// Route pour terminer une maintenance
router.put("/terminer/:id", async (req, res) => {
    try {
        const { date_realisée } = req.body;

        const maintenance = await Maintenance.findByIdAndUpdate(
            req.params.id,
            {
                date_realisée: date_realisée || new Date(),
                statut: "Terminée"
            },
            { new: true }
        ).populate("vehicule");

        if (!maintenance) {
            return res.status(404).json({ message: "Maintenance non trouvée" });
        }

        // Mettre à jour le véhicule
        if (maintenance.vehicule) {
            await Vehicule.findByIdAndUpdate(
                maintenance.vehicule._id,
                { statut: "Disponible" }
            );
        }

        res.status(200).json(maintenance);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
});

// Route pour vérifier les vidanges nécessaires (10 000 km ou plus depuis la dernière vidange)
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

module.exports = router;
