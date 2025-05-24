const express = require('express');
const router = express.Router();
const Client = require('../model/Client');
const Location = require('../model/Location'); 

// GET : Récupérer tous les clients avec leur statut de location
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        const allLocations = await Location.find();

        const clientsWithStatus = clients.map(client => {
            const locationsDuClient = allLocations.filter(loc => 
                loc.clientId.toString() === client._id.toString()
            );

const hasOngoingLocation = locationsDuClient.some(loc => loc.statut !== 'terminée');

            return {
                ...client._doc,
                nombreLocations: locationsDuClient.length,
                locationEnCours: hasOngoingLocation
            };
        });

        res.status(200).json(clientsWithStatus);
    } catch (error) {
        console.error("Erreur lors de la récupération des clients :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des clients." });
    }
});

// GET : Récupérer un client par son CIN
router.get('/cin/:cin', async (req, res) => {
    try {
        const client = await Client.findOne({ CIN: req.params.cin });
        if (!client) {
            return res.status(404).json({ message: "Client non trouvé" });
        }
        res.status(200).json(client);
    } catch (error) {
        console.error("Erreur lors de la recherche du client par CIN :", error);
        res.status(500).json({ message: "Erreur serveur lors de la recherche du client." });
    }
});

// PUT : Mettre à jour un client
router.put('/:id', async (req, res) => {
    try {
        const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedClient) {
            return res.status(404).json({ message: "Client non trouvé" });
        }
        res.status(200).json(updatedClient);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du client :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour du client." });
    }
});

// GET : Vérifier si un client est blacklisté par CIN
router.get('/check-blacklist/:cin', async (req, res) => {
    try {
        const client = await Client.findOne({ CIN: req.params.cin });
        if (!client) {
            return res.status(200).json({ blacklisted: false });
        }
        res.status(200).json({ 
            blacklisted: client.blacklisted,
            client: client
        });
    } catch (error) {
        console.error("Erreur lors de la vérification blacklist:", error);
        res.status(500).json({ message: "Erreur serveur lors de la vérification." });
    }
});

// DELETE : Supprimer un client par ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedClient = await Client.findByIdAndDelete(req.params.id);
        if (!deletedClient) {
            return res.status(404).json({ message: "Client non trouvé" });
        }
        res.status(200).json({ message: "Client supprimé avec succès" });
    } catch (error) {
        console.error("Erreur lors de la suppression du client :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression du client." });
    }
});

module.exports = router;
