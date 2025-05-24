const express = require("express");
const router = express.Router();
const userController = require("../controller/user");
const historyController = require("../controller/history");  


// Récupérer tous les employés
router.get("/", userController.getUsers);

// Ajouter un employé
router.post("/", userController.createUser);

// Modifier un employé
router.put("/:id", userController.updateUser);

// Supprimer un employé
router.delete("/:id", userController.deleteUser);

// Réinitialiser le mot de passe d’un employé (envoyer un mail)
router.post("/reset-password-email/:id", userController.sendResetPasswordEmail);

// Modifier rôle de l’utilisateur (si besoin)
router.put("/changer-role/:id", userController.changeRole);


// Modifier rôle de l’utilisateur (si besoin)
router.put("/changer-role/:id", userController.changeRole);


module.exports = router;
