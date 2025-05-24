const ErrorResponse = require("../utils/ErrorResponse");

// Middleware pour autoriser selon les rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    // Vérifie si le rôle de l'utilisateur est inclus dans les rôles autorisés
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`Accès refusé : rôle '${req.user.role}' non autorisé`, 403)
      );
    }
    next();
  };
};

module.exports = authorize;
