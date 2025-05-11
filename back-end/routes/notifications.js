const express = require('express');
const router = express.Router();
const Vehicule = require('../model/Vehicule');
const Notification = require('../model/Notification');

// Ajouter un véhicule
router.post('/add', async (req, res) => {
  const { marque, modele, immatriculation, annee, kilometrage, carburant, assurance, maintenance, prixParJour } = req.body;

  if (!marque || !modele || !immatriculation || !annee || !kilometrage || !carburant || !assurance || !maintenance || !prixParJour) {
    return res.status(400).json({ message: 'Tous les champs sont requis pour ajouter un véhicule' });
  }

  const vehicule = new Vehicule({
    marque,
    modele,
    immatriculation,
    annee,
    kilometrage,
    carburant,
    assurance,
    maintenance,
    prixParJour
  });

  try {
    const newVehicule = await vehicule.save();

    // Créer une notification après l'ajout d'un véhicule
    const notification = new Notification({
      message: `Nouveau véhicule ajouté : ${newVehicule.marque} ${newVehicule.modele}`,
    });
    await notification.save();

    res.status(201).json(newVehicule);
  } catch (err) {
    res.status(400).json({ message: `Erreur lors de l'ajout du véhicule : ${err.message}` });
  }
});

// Modifier un véhicule
router.put('/update/:id', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    const { marque, modele, immatriculation, annee, kilometrage, carburant, assurance, maintenance, prixParJour } = req.body;

    // Vérifie si les champs sont fournis et met à jour le véhicule
    vehicule.marque = marque || vehicule.marque;
    vehicule.modele = modele || vehicule.modele;
    vehicule.immatriculation = immatriculation || vehicule.immatriculation;
    vehicule.annee = annee || vehicule.annee;
    vehicule.kilometrage = kilometrage || vehicule.kilometrage;
    vehicule.carburant = carburant || vehicule.carburant;
    vehicule.assurance = assurance || vehicule.assurance;
    vehicule.maintenance = maintenance || vehicule.maintenance;
    vehicule.prixParJour = prixParJour || vehicule.prixParJour;

    await vehicule.save();

    // Créer une notification après la modification du véhicule
    const notification = new Notification({
      message: `Véhicule modifié : ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
    });
    await notification.save();

    res.json(vehicule);
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la mise à jour du véhicule : ${err.message}` });
  }
});

// Supprimer un véhicule
router.delete('/delete/:id', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    await vehicule.remove();

    // Créer une notification après la suppression du véhicule
    const notification = new Notification({
      message: `Véhicule supprimé : ${vehicule.marque} ${vehicule.modele} (${vehicule.immatriculation})`,
    });
    await notification.save();

    res.json({ message: 'Véhicule supprimé' });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la suppression du véhicule : ${err.message}` });
  }
});

// Récupérer toutes les notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }); 
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la récupération des notifications : ${err.message}` });
  }
});
// PUT marquer comme lue
router.put('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { seen: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Supprimer une notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }
    res.json({ message: 'Notification supprimée' });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors de la suppression de la notification : ${err.message}` });
  }
});
// Récupérer le nombre de notifications non lues
router.get('/unread/count', async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ seen: false });
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: `Erreur lors du comptage des notifications non lues : ${err.message}` });
  }
});


module.exports = router;
