import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';

const ContratLocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { contratData } = location.state || {};

  if (!contratData) {
    return (
      <div className="container mt-5">
        <h2>Erreur</h2>
        <p>Aucune donnée de contrat trouvée.</p>
        <Button variant="primary" onClick={() => navigate('/location')}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="container mt-5 contrat-container">
      <h2 className="mb-4">Contrat de Location</h2>
      
      <div className="contrat-section">
        <h4>Informations Client</h4>
        <p><strong>Nom :</strong> {contratData.clientPrenom} {contratData.clientNom}</p>
        <p><strong>CIN :</strong> {contratData.clientCIN}</p>
        <p><strong>Téléphone :</strong> {contratData.telephone}</p>
        <p><strong>Ville :</strong> {contratData.ville}</p>
      </div>

      <div className="contrat-section">
        <h4>Détails de la Location</h4>
        <p><strong>Véhicule :</strong> {contratData.vehiculeId}</p>
        <p><strong>Du :</strong> {contratData.startDate}</p>
        <p><strong>Au :</strong> {contratData.endDate}</p>
        <p><strong>Prix par jour :</strong> {contratData.prixParJour} DT</p>
        <p><strong>Prix total :</strong> {contratData.prixTotal} DT</p>
        <p><strong>Kilométrage de départ :</strong> {contratData.kilometrageDebut} km</p>
      </div>

      <div className="contrat-section">
        <h4>Garantie</h4>
        <p><strong>Type :</strong> {contratData.typeGarantie}</p>
        <p><strong>Montant :</strong> {contratData.montantGarantie} DT</p>
      </div>

      <Button variant="secondary" onClick={() => navigate('/location')}>Retour à la gestion</Button>
    </div>
  );
};

export default ContratLocation;
