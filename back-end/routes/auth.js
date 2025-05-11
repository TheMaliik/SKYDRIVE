const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");
const protect = require("../middleware/protect"); 


// Connexion
router.post("/login", authController.login);

// Déconnexion
router.post("/logout", authController.logout);

// Enregistrement d'un nouvel utilisateur (employé ou admin selon usage)
router.post("/register", authController.register);

// Mot de passe oublié
router.post("/forgot-password", authController.forgotPassword);

// Réinitialisation du mot de passe
router.put("/reset-password/:token", authController.resetPassword);

// Vérification du token avant affichage du formulaire de réinitialisation
router.get("/reset-password/:token", authController.verifyResetToken);

module.exports = router;
