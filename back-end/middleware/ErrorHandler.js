const ErrorResponse = require("../utils/ErrorResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 🔹 Mauvais ID (ex: Mongoose ObjectId invalide)
  if (err.name === "CastError") {
    error = new ErrorResponse(`Ressource non trouvée avec cet ID`, 404);
  }

  // 🔹 Valeur dupliquée (ex: Email déjà enregistré)
  if (err.code === 11000) {
    error = new ErrorResponse("Champ dupliqué détecté", 400);
  }

  // 🔹 Erreur d'authentification (ex: mauvais email/mot de passe)
  if (err.message === "Invalid credentials") {
    error = new ErrorResponse("Email ou mot de passe incorrect", 401);
  }

  // 🔹 Jeton invalide ou non fourni
  if (err.name === "JsonWebTokenError") {
    error = new ErrorResponse("Non autorisé, jeton invalide", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new ErrorResponse("Session expirée, veuillez vous reconnecter", 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Erreur du serveur",
  });
};

module.exports = errorHandler;


