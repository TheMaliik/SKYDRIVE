const express = require('express');
const router = express.Router();
const Location = require('../model/Location');
const Maintenance = require('../model/maintenance');
const Finance = require('../model/Finance');


router.post('/archive', async (req, res) => {
    try {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear();
      const periode = `${month}-${year}`;
  
      // Vérifie si déjà archivé
      const existe = await Finance.findOne({ periode });
      if (existe) return res.status(400).json({ message: "Déjà archivé pour cette période" });
  
      // Début et fin du mois
      const start = new Date(year, now.getMonth(), 1);
      const end = new Date(year, now.getMonth() + 1, 0);
  
      // Récupération des données
      const locations = await Location.find({ dateDebut: { $gte: start, $lte: end } });
      const maintenances = await Maintenance.find({ date: { $gte: start, $lte: end } });
  
      const totalRevenus = locations.reduce((acc, loc) => acc + (loc.montant || 0), 0);
      const totalDepenses = maintenances.reduce((acc, m) => acc + (m.montant || 0), 0);
      const resultatNet = totalRevenus - totalDepenses;
  
      const detailsRevenus = locations.map(loc => ({
        location: loc._id,
        montant: loc.montant
      }));
  
      const detailsDepenses = maintenances.map(m => ({
        maintenance: m._id,
        montant: m.montant
      }));
  
      const archive = new Finance({
        periode,
        totalRevenus,
        totalDepenses,
        resultatNet,
        detailsRevenus,
        detailsDepenses
      });
  
      await archive.save();
      res.status(201).json({ message: "Archive créée avec succès", archive });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Erreur serveur lors de l’archivage" });
    }
  });
  
router.get('/', async (req, res) => {
  try {
    // Récupérer toutes les locations
    const locations = await Location.find();
    const maintenances = await Maintenance.find();

    // Total revenus
    const totalRevenus = locations.reduce((acc, loc) => acc + (loc.montant || 0), 0);

    // Total dépenses
    const totalDepenses = maintenances.reduce((acc, m) => acc + (m.montant || 0), 0);

    // Bénéfice
    const resultatNet = totalRevenus - totalDepenses;

    res.json({
      revenus: locations,
      depenses: maintenances,
      totalRevenus,
      totalDepenses,
      resultatNet
    });
  } catch (error) {
    console.error('Erreur finance:', error);
    res.status(500).json({ message: "Erreur serveur lors du calcul financier" });
  }
});

module.exports = router;
