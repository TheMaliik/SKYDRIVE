const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Location = require('../model/Location');
const Client = require('../model/Client');
const Vehicule = require('../model/Vehicule');
const Event = require('../model/Event');
const Notification = require('../model/Notification');

// Fonction pour mettre à jour le statut fidélité
const updateFidelityStatus = (client) => {
  if (client.nombreLocations >= 10) {
    client.fidelityStatus = "VIP";
  } else if (client.nombreLocations >= 7) {
    client.fidelityStatus = "20% de remise";
  } else if (client.nombreLocations >= 3) {
    client.fidelityStatus = "10% de remise";
  } else {
    client.fidelityStatus = "Non fidélisé";
  }
  return client;
};

// GET : Récupérer toutes les locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('clientId', 'prenom nom telephone ville CIN fidelityStatus')
      .populate('vehiculeId', 'marque modele prixParJour statut immatriculation kilometrage')
      .sort({ startDate: -1 });

    const transformedLocations = locations.map(loc => ({
      ...loc._doc,
      client: loc.clientId,
      vehicule: loc.vehiculeId
    }));

    res.status(200).json(transformedLocations);
  } catch (error) {
    console.error("Erreur lors de la récupération des locations:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des locations",
      error: error.message
    });
  }
});

// GET : Détails d'une location spécifique
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('clientId')
      .populate('vehiculeId');

    if (!location) {
      return res.status(404).json({ message: "Location non trouvée" });
    }

    res.status(200).json({
      ...location._doc,
      client: location.clientId,
      vehicule: location.vehiculeId
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la location:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération de la location",
      error: error.message
    });
  }
});

// POST : Créer une nouvelle location
router.post('/', async (req, res) => {
  try {
    const { vehiculeId, startDate, endDate, client, kilometrageDebut, overrideBlacklist } = req.body;

    // Validation des données
    if (!vehiculeId || !startDate || !endDate || !client || !client.CIN) {
      return res.status(400).json({ message: "Données manquantes pour la location" });
    }

    // Validation des dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return res.status(400).json({ message: "La date de fin doit être après la date de début" });
    }

    // Vérification du véhicule
    const vehicule = await Vehicule.findById(vehiculeId);
    if (!vehicule) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }
    if (vehicule.statut !== "Disponible") {
      return res.status(400).json({ message: "Le véhicule n'est pas disponible" });
    }

    // Gestion du client
    let clientDoc = await Client.findOne({ CIN: client.CIN });

    // Vérification liste noire
    if (clientDoc && clientDoc.blacklisted && !overrideBlacklist) {
      return res.status(403).json({ 
        message: "Ce client est dans la liste noire",
        code: "CLIENT_BLACKLISTED"
      });
    }

    // Calcul de la durée
    const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    let remise = 0;

    // Création ou mise à jour du client
    if (!clientDoc) {
      clientDoc = new Client({
        CIN: client.CIN,
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone,
        ville: client.ville,
        nombreLocations: 1
      });
    } else {
      clientDoc.nombreLocations += 1;
      // Application des remises
      if (clientDoc.fidelityStatus === "10% de remise") remise = 0.10;
      else if (clientDoc.fidelityStatus === "20% de remise") remise = 0.20;
      else if (clientDoc.fidelityStatus === "VIP") remise = 0.30;
    }

    // Mise à jour du statut fidélité
    updateFidelityStatus(clientDoc);
    await clientDoc.save();

    // Calcul du prix
    const prixAvantRemise = vehicule.prixParJour * durationInDays;
    const prixAvecRemise = prixAvantRemise * (1 - remise);
    const prixTTC = Number((prixAvecRemise * 1.19).toFixed(2)); // TVA 19%

    // Création de la location
    const location = new Location({
      clientId: clientDoc._id,
      vehiculeId,
      startDate: start,
      endDate: end,
      prixTTC,
      kilometrageInitial: kilometrageDebut || vehicule.kilometrage,
      statut: "active"
    });
    await location.save();

    // Mise à jour du statut du véhicule
    await Vehicule.findByIdAndUpdate(vehiculeId, { statut: "Loué" });

    // Création de l'événement
    const event = new Event({
      title: `Location - ${vehicule.marque} ${vehicule.modele}`,
      start: start,
      end: end,
      category: "location",
      locationId: location._id
    });
    await event.save();

    // Notification
    await Notification.create({
      message: `Nouvelle location: ${vehicule.marque} ${vehicule.modele} par ${client.prenom} ${client.nom}`
    });

    res.status(201).json({
      message: "Location créée avec succès",
      location: {
        ...location._doc,
        client: clientDoc,
        vehicule: vehicule,
        remise: `${remise * 100}%`,
        duree: durationInDays
      }
    });

  } catch (error) {
    console.error("Erreur lors de la création de la location:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création de la location",
      error: error.message
    });
  }
});

// PUT : Terminer une location
router.put('/:id/terminer', async (req, res) => {
  try {
    const { id } = req.params;
    const { kilometrageFinal } = req.body;

    const location = await Location.findById(id).populate('vehiculeId');
    if (!location) {
      return res.status(404).json({ message: "Location non trouvée" });
    }

    if (kilometrageFinal < location.kilometrageInitial) {
      return res.status(400).json({
        message: "Le kilométrage final doit être supérieur au kilométrage initial"
      });
    }

    // Calcul distance parcourue
    const distanceParcourue = kilometrageFinal - location.kilometrageInitial;
    const vidangeNecessaire = distanceParcourue >= 10000;

    // Mise à jour du véhicule
    await Vehicule.findByIdAndUpdate(
      location.vehiculeId._id,
      {
        statut: "Disponible",
        kilometrage: kilometrageFinal,
        dernierKilometrageVidange: vidangeNecessaire ? 
          kilometrageFinal : 
          location.vehiculeId.dernierKilometrageVidange
      }
    );

    // Mise à jour de la location
    location.statut = "terminée";
    location.kilometrageFinal = kilometrageFinal;
    location.distanceParcourue = distanceParcourue;
    location.endDateEffective = new Date();
    await location.save();

    // Suppression de l'événement
    await Event.deleteOne({ locationId: id });

    // Notification
    await Notification.create({
      message: `Location terminée: ${location.vehiculeId.marque} ${location.vehiculeId.modele}`,
      isAlert: vidangeNecessaire
    });

    res.status(200).json({
      message: "Location terminée avec succès",
      distanceParcourue,
      vidangeNecessaire
    });

  } catch (error) {
    console.error("Erreur lors de la terminaison de la location:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la terminaison de la location",
      error: error.message
    });
  }
});






module.exports = router;