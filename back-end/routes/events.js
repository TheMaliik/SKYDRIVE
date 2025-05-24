const express = require('express');
const router = express.Router();
const Event = require('../model/Event');

router.get('/', async (req, res) => {
  try {
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
    $unwind: { path: "$location", preserveNullAndEmptyArrays: true }
  },

  {
    $lookup: {
      from: "maintenances", // Collection des maintenances
      localField: "maintenanceId",
      foreignField: "_id",
      as: "maintenance"
    }
  },
  {
    $unwind: { path: "$maintenance", preserveNullAndEmptyArrays: true }
  },

  // Ajouter clientId à la racine (pour location)
  {
    $addFields: {
      clientId: "$location.clientId",
      maintenanceStatut: "$maintenance.statut"  // On récupère le statut maintenance
    }
  },

  {
    $lookup: {
      from: "clients",
      localField: "clientId",
      foreignField: "_id",
      as: "client"
    }
  },
  {
    $unwind: { path: "$client", preserveNullAndEmptyArrays: true }
  },

  {
    $match: {
      $or: [
        {
          category: "maintenance",
          maintenanceStatut: { $ne: "Terminée" }  // Filtrer les maintenances terminées
        },
        {
          category: "location",
          "location.statut": { $ne: "terminée" }
        }
      ]
    }
  },

  {
    $project: {
      title: 1,
      start: 1,
      end: 1,
      category: 1,
      locationId: 1,
      clientNom: "$client.nom",
      clientPrenom: "$client.prenom",
      maintenanceStatut: 1
    }
  }
]);

    res.json(events);
  } catch (err) {
    console.error("Erreur lors de la récupération des événements :", err);
    res.status(500).json({ message: "Erreur serveur" });
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
