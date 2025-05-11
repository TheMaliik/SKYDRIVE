// routes/history.js
const express = require('express');
const router = express.Router();
const ConnectionHistory = require('../model/connectionHistory');

// Route GET sur /api/history
router.get('/', async (req, res) => {
  try {
    const role = req.query.role; // ?role=admin ou ?role=user
    const query = role ? { 'userId.role': role } : {}; // Filtrer par rôle si présent

    const history = await ConnectionHistory.find(query)
      .populate('userId', 'name email role') // Ramène les infos de l'utilisateur
      .sort({ loginTime: -1 }); // Ordre décroissant (plus récent en premier)

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des connexions :", error);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
});

module.exports = router;
