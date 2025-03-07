const express = require("express");
const {
  login,
  register,
  getAllUsers
} = require("../controller/auth");
const router = express.Router();

// Routes pour l'authentification
router.post("/login", login);
router.post("/register", register);

// Routes pour les utilisateurs
router.get("/users", getAllUsers);


module.exports = router;
