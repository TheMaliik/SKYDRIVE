const jwt = require("jsonwebtoken");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/ErrorResponse");
const User = require("../model/User");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // Récupérer le token depuis l'en-tête
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")  
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Non autorisé à accéder à cette ressource", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return next(new ErrorResponse("Token invalide", 401));
  }
});
