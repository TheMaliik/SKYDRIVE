const checkRole = (roles) => {
    return (req, res, next) => {
      const userRole = req.user.role; 
      if (!roles.includes(userRole)) {
        return res.status(403).json({ error: "Accès interdit" });
      }
      next();
    };
  };
  
  module.exports = checkRole;
  