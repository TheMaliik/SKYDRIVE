const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/ErrorHandler");



const vehiculeStatsRoutes = require('./routes/VehiculeStats'); 
const contractRoutes = require('./routes/Contrat');
const financeRoutess = require('./routes/FinanceRoutes');
const clientStatsRoutes = require('./routes/ClientStatsRoutes');

const app = express();
require("dotenv").config();

// Connexion à MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/skydrive")
  .then(() => console.log("MongoDB connecté !"))
  .catch((err) => console.error("Erreur de connexion MongoDB :", err));

// Middleware
app.use(express.json());
app.use(logger);
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

console.log("Express initialisé !");

// Importation des routes avec gestion des erreurs
let authRoutes, vehiculesRoutes, maintenanceRoutes, usersRoutes, locationsRoutes, clientRoutes, eventsRoutes, historyRoutes, notificationsRoutes, financeRoutes;

try {
  authRoutes = require("./routes/auth");
  console.log("authRoutes chargé !");
} catch (error) {
  console.error("Erreur dans authRoutes :", error);
}

try {
  vehiculesRoutes = require("./routes/Vehicules");
  console.log("vehiculesRoutes chargé !");
} catch (error) {
  console.error("Erreur dans vehiculesRoutes :", error);
}

try {
  maintenanceRoutes = require("./routes/maintenance");
  console.log("maintenanceRoutes chargé !");
} catch (error) {
  console.error("Erreur dans maintenanceRoutes :", error);
}

try {
  locationsRoutes = require("./routes/locations");
  console.log("locationsRoutes chargé !");
} catch (error) {
  console.error("Erreur dans locationsRoutes :", error);
}

try {
  clientRoutes = require("./routes/client");
  console.log("clientRoutes chargé !");
} catch (error) {
  console.error("Erreur dans clientRoutes :", error);
}

try {
  usersRoutes = require("./routes/users");  
  console.log("usersRoutes chargé !");
} catch (error) {
  console.error("Erreur dans usersRoutes :", error);
}

try {
  eventsRoutes = require("./routes/events");
  console.log("eventsRoutes chargé !");
} catch (error) {
  console.error("Erreur dans eventsRoutes :", error);
}

try {
  historyRoutes = require("./routes/history");
  console.log("historyRoutes chargé !");
} catch (error) {
  console.error("Erreur dans historyRoutes :", error);
}

try {
  notificationsRoutes = require("./routes/notifications");
  console.log("notificationsRoutes chargé !");
} catch (error) {
  console.error("Erreur dans notificationsRoutes :", error);
}

try {
  financeRoutes = require("./routes/finance");
  console.log("financeRoutes chargé !");
} catch (error) {
  console.error("Erreur dans financeRoutes :", error);
}

// Ajout des routes uniquement si elles existent
if (authRoutes) app.use("/api/auth", authRoutes);
if (vehiculesRoutes) app.use("/api/vehicules", vehiculesRoutes);
if (maintenanceRoutes) app.use("/api/maintenance", maintenanceRoutes);
if (locationsRoutes) app.use("/api/locations", locationsRoutes);
if (clientRoutes) app.use("/api/client", clientRoutes);
if (usersRoutes) app.use("/api/users", usersRoutes);  
if (eventsRoutes) app.use("/api/events", eventsRoutes);
if (historyRoutes) app.use("/api/history", historyRoutes);
if (notificationsRoutes) app.use("/api/notifications", notificationsRoutes);
if (financeRoutes) app.use("/api/finance", financeRoutes);



app.use('/api/stats', vehiculeStatsRoutes); 
app.use('/api/contracts', contractRoutes);
app.use('/api/finance', financeRoutess);
app.use('/api/statsClient',clientStatsRoutes);

// Gestion des erreurs
app.use(errorHandler);

module.exports = app;
