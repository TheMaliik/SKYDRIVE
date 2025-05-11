const express = require('express');
const router = express.Router();
const Client = require('../model/Client');

// GET : Récupérer tous les clients
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json(clients);
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

module.exports = router;