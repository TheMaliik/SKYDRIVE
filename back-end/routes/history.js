const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Utiliser le modèle déjà existant au lieu d'en créer un nouveau
const ConnectionHistory = mongoose.model('ConnectionHistory');

// Route GET pour obtenir l'historique des connexions
router.get('/', async (req, res) => {
  try {
    const role = req.query.role;
    
    let query = {};
    if (role) {
      query = { 'userId.role': role };
    }

    const history = await ConnectionHistory.find(query)
      .populate('userId', 'email nom prenom role')
      .sort({ loginTime: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique des connexions:", error);
    res.status(500).json({
      success: false,
      message: "Impossible de récupérer l'historique des connexions",
      error: error.message
    });
  }
});

module.exports = router;