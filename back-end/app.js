const express = require("express");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/ErrorHandler");
const cors = require("cors");
const logger = require("./middleware/logger");
const authRoutes = require("./routres/auth");

// Connection à la base de données
connectDB();

const app = express();

// Middleware pour analyser les JSON
app.use(express.json());

// Middleware de journalisationroutes
app.use(logger);

// Activer les requêtes depuis d'autres origines
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes de l'application
app.use("/api/auth", authRoutes);



// Middleware de gestion des erreurs
app.use(errorHandler);

const PORT = 4000;
const server = app.listen(PORT, () => console.log(`Écoute sur le port ${PORT}`));

// Gestion des promesses non gérées
process.on("unhandledRejection", (err) => {
  console.error(`Erreur : ${err.message}`);
  server.close(() => process.exit(1));
});
