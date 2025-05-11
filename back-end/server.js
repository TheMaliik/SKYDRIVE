const app = require("./app");
const connectDB = require("./config/db");
const http = require("http");
const WebSocket = require("ws");
require("dotenv").config();  // Charge les variables d'environnement depuis le fichier .env

// Vérification des variables d'environnement
if (!process.env.DB_URI || !process.env.PORT) {
  console.error("Les variables d'environnement ne sont pas correctement définies !");
  process.exit(1); // Arrêter le serveur si les variables manquent
} else {
  console.log(`Base de données URI : ${process.env.DB_URI}`);
  console.log(`Port : ${process.env.PORT}`);
}

// Connexion à la base de données en utilisant la variable d'environnement DB_URI
connectDB(process.env.DB_URI);

// Création du serveur HTTP
const server = http.createServer(app);

// Création du serveur WebSocket
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("Client WebSocket connecté");

    ws.on("message", (message) => {
        console.log("Message reçu :", message);
        ws.send("Message bien reçu");
    });

    ws.on("close", () => {
        console.log("Client WebSocket déconnecté");
    });
});

// Démarrer le serveur HTTP et WebSocket sur le port spécifié dans .env
const PORT = process.env.PORT || 5000; // Utilisation de la variable d'environnement PORT
server.listen(PORT, () => {
    console.log(`Serveur HTTP & WebSocket en écoute sur le port ${PORT}`);
});
// Gestion des erreurs globales
process.on("unhandledRejection", (err) => {
    console.error(`Erreur critique : ${err.message}`);
    process.exit(1);
});
