const express = require('express');
const router = express.Router();
const Event = require('../model/Event');

router.get('/', async (req, res) => {
  try {
      // Récupère seulement les événements liés aux locations actives
      const events = await Event.aggregate([
          {
              $lookup: {
                  from: "locations",
                  localField: "locationId",
                  foreignField: "_id",
                  as: "location"
              }
          },
          {
              $match: {
                  "location.statut": { $ne: "terminée" }
              }
          },
          {
              $project: {
                  title: 1,
                  start: 1,
                  end: 1,
                  category: 1,
                  locationId: 1
              }
          }
      ]);

      res.json(events);
  } catch (err) {
      console.error("Erreur lors de la récupération des événements :", err);
      res.status(500).json({ message: "Erreur serveur" });
  }
});

// Créer un nouvel événement (optionnel, utilisé si on ajoute via calendrier) 
router.post('/', async (req, res) => {
  try {
    const { title, start, end, category, locationId } = req.body;

    const newEvent = new Event({ title, start, end, category, locationId });
    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (err) {
    console.error("Erreur lors de l'ajout d'un événement :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});
// Mettre à jour un événement par ID
router.put('/:id', async (req, res) => {
  try {
    const { title, start, end, category, locationId } = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { title, start, end, category, locationId },
      { new: true } // retourne l'objet mis à jour
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.status(200).json(updatedEvent);
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'événement :", err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour' });
  }
});


// Supprimer un événement par ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    res.status(200).json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error("Erreur suppression :", error);
    res.status(500).json({ message: 'Erreur lors de la suppression', error });
  }
});



module.exports = router;
