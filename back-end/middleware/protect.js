const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/ErrorResponse");
const User = require("../model/User");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Récupérer le token depuis l'en-tête
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token trouvé dans l'en-tête :", token); // Affiche le token
  }

  if (!token) {
    return next(new ErrorResponse("Non autorisé à accéder à cette ressource", 401));
  }

  try {
    // Décodage du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    console.log("Token décodé :", decoded); // Affiche le contenu du token décodé

    // Recherche de l'utilisateur dans la base de données
    req.user = await User.findById(decoded.id);
    console.log("Utilisateur trouvé :", req.user); // Affiche l'utilisateur trouvé

    if (!req.user) {
      return next(new ErrorResponse("Utilisateur non trouvé", 404));
    }

    next();
  } catch (err) {
    console.error("Erreur lors de la vérification du token :", err);
    return next(new ErrorResponse("Token invalide", 401));
  }
});
