const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.user.role; // Récupère le rôle depuis le token ou la session
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: "Accès interdit" });
      }
      next();
    };
  };
  
  module.exports = checkRole;
  