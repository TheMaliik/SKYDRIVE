
exports.getConnectionHistory = (req, res) => {
    const { role } = req.params;
    
    // Implémente la logique pour récupérer l'historique des connexions en fonction du rôle
    // Par exemple, tu peux récupérer l'historique depuis la base de données
    
    res.json({ message: `Historique des connexions pour le rôle: ${role}` });
  };
  