import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import '../styles/GestionLocation.css';
import { API_VEHICULES, API_CLIENTS, API_LOCATIONS, API_EVENTS } from '../api';
import { toast } from 'react-toastify';

const LocationPage = () => {
  // États
  const [vehicules, setVehicules] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showForm, setShowForm] = useState(false);
  const calendarRef = useRef(null);
  const [, setEvents] = useState([]);
  const [cinValide, setCinValide] = useState(false);
  const [cinMessage, setCinMessage] = useState('');

  const [formData, setFormData] = useState({
    vehiculeId: '',
    clientCIN: '',
    clientPrenom: '',
    clientNom: '',
    telephone: '',
    ville: '',
    startDate: '',
    endDate: '',
    prixTotal: 0,
    prixParJour: 0,
    prixHT: 0,
    prixTTC: 0,
    kilometrageDebut: '',
    typeGarantie: '',
    montantGarantie: ''
  });

  // Chargement des données
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiculesRes, clientsRes, locationsRes, eventsRes] = await Promise.all([
        axios.get(API_VEHICULES),
        axios.get(API_CLIENTS),
        axios.get(API_LOCATIONS),
        axios.get(API_EVENTS)
      ]);

      setVehicules(vehiculesRes.data);
      setClients(clientsRes.data);
      setLocations(locationsRes.data);
      setEvents(eventsRes.data);

      if (calendarRef.current) {
        calendarRef.current.getApi().removeAllEvents();
        calendarRef.current.getApi().addEvents(eventsRes.data);
      }

      toast.success('Données chargées avec succès !');
    } catch (error) {
      console.error('Erreur de chargement:', error);
      setMessage({
        text: 'Erreur lors du chargement des données',
        type: 'error'
      });
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  // Appel des données au démarrage
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'clientCIN') {
      const isValid = /^\d{8}$/.test(value);
      setCinValide(isValid);
      setCinMessage(isValid ? '' : 'Le CIN doit contenir exactement 8 chiffres');
    }

    const processedValue = ['prixTotal', 'prixParJour', 'prixHT', 'prixTTC', 'montantGarantie'].includes(name)
      ? parseFloat(value) || 0
      : ['kilometrageDebut'].includes(name)
        ? parseInt(value) || 0
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Mise à jour du kilométrage initial quand véhicule change
  useEffect(() => {
    if (formData.vehiculeId) {
      const selectedVehicule = vehicules.find(v => v._id === formData.vehiculeId);
      if (selectedVehicule) {
        setFormData(prev => ({
          ...prev,
          kilometrageDebut: selectedVehicule.kilometrage || 0,
          prixParJour: selectedVehicule.prixParJour || 0
        }));
        toast.success('Véhicule sélectionné, kilométrage et prix mis à jour !');
      }
    }
  }, [formData.vehiculeId, vehicules]);

  // Calcul du prix
  useEffect(() => {
    const calculatePrice = () => {
      try {
        const { vehiculeId, clientCIN, startDate, endDate } = formData;
        if (!vehiculeId || !clientCIN || !startDate || !endDate) return;

        const vehicule = vehicules.find(v => v._id === vehiculeId);
        const client = clients.find(c => c.CIN === formData.clientCIN);

        if (!vehicule?.prixParJour || isNaN(vehicule.prixParJour)) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const diffTime = end - start;
        const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
        let prixHT = days * vehicule.prixParJour;

        if (client?.fidelityStatus === 'VIP') {
          prixHT *= 0.8;
        } else if (client?.fidelityStatus === '10% de remise') {
          prixHT *= 0.9;
        }

        const TVA_RATE = 0.19;
        const prixTTC = prixHT + (prixHT * TVA_RATE);

        const roundedPrixHT = parseFloat(prixHT.toFixed(2));
        const roundedPrixTTC = parseFloat(prixTTC.toFixed(2));

        if (formData.prixHT !== roundedPrixHT || formData.prixTTC !== roundedPrixTTC) {
          setFormData(prev => ({
            ...prev,
            prixHT: roundedPrixHT,
            prixTTC: roundedPrixTTC
          }));
          toast.success('Prix calculé avec succès !');
        }
      } catch (error) {
        console.error('Erreur dans le calcul du prix:', error);
        toast.error('Erreur lors du calcul du prix');
      }
    };

    calculatePrice();
  }, [formData, vehicules, clients]);

  // Mise à jour des infos client quand CIN change
  useEffect(() => {
    const updateClientInfo = () => {
      try {
        if (!formData.clientCIN || !clients?.length) return;

        const client = clients.find(c => c.CIN === formData.clientCIN);

        if (!client) {
          setFormData(prev => ({
            ...prev,
            clientNom: '',
            clientPrenom: '',
            telephone: '',
            ville: ''
          }));
          toast.warn('Aucun client trouvé pour ce CIN');
          return;
        }

        setFormData(prev => ({
          ...prev,
          clientNom: client.nom ?? '',
          clientPrenom: client.prenom ?? '',
          telephone: client.telephone ?? '',
          ville: client.ville ?? ''
        }));
        toast.success(`Informations du client ${client.prenom} ${client.nom} chargées !`);
      } catch (error) {
        console.error("Erreur dans la mise à jour des infos client:", error);
        toast.error('Erreur lors de la mise à jour des informations du client');
      }
    };

    updateClientInfo();
  }, [formData.clientCIN, clients]);

  // Terminer une location
  const handleTerminate = async (location) => {
    try {
      const locationId = location._id;
      const kilometrageInitial = location.kilometrageInitial || location.vehiculeId?.kilometrage;
      if (!kilometrageInitial) {
        toast.error("Kilométrage initial non disponible.");
        return;
      }

      let isValid = false;
      let kilometrageFinal;
      let distanceParcourue = 0;

      while (!isValid) {
        const kilometrageFinalInput = prompt(
          `Kilométrage actuel: ${kilometrageInitial}\nEntrez le kilométrage final (doit être > ${kilometrageInitial}):`
        );

        if (kilometrageFinalInput === null) return;

        kilometrageFinal = parseInt(kilometrageFinalInput, 10);

        if (isNaN(kilometrageFinal)) {
          toast.error("Veuillez entrer un nombre valide pour le kilométrage final.");
          continue;
        }

        if (kilometrageFinal <= kilometrageInitial) {
          toast.error(`Erreur: Le kilométrage final (${kilometrageFinal}) doit être supérieur au kilométrage initial (${kilometrageInitial}).`);
          continue;
        }

        distanceParcourue = kilometrageFinal - kilometrageInitial;
        isValid = true;
      }

      await axios.put(`${API_LOCATIONS}/${locationId}/terminer`, { kilometrageFinal });
      await fetchAllData();
      toast.success(`Location terminée avec succès ! Distance parcourue : ${distanceParcourue} km`);
    } catch (error) {
      console.error("Erreur:", error);
      const errorMessage = error.response?.data?.message || "Erreur lors de la terminaison de la location";
      toast.error(errorMessage);
    }
  };

  // Generate and send contract PDF
  const generateAndSendContract = async (locationId) => {
    console.log('Starting generateAndSendContract for locationId:', locationId);

    const location = locations.find(loc => loc._id === locationId);
    if (!location) {
      console.error('Location not found for ID:', locationId);
      toast.error('Location non trouvée.');
      return;
    }

    const client = location.client || {};
    const vehicule = location.vehiculeId || {};

    try {
      setLoading(true);
      console.log('Generating PDF for location:', locationId);

      // Create new jsPDF instance
      const doc = new jsPDF();
      doc.setFontSize(12);

      // Add content to PDF
      doc.text('Contrat de Location de Véhicule', 20, 20);
      doc.text(`Numéro de location: ${locationId}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 40);
      
      doc.text('Informations du Client:', 20, 60);
      doc.text(`Nom: ${client.prenom || ''} ${client.nom || ''}`, 30, 70);
      doc.text(`CIN: ${client.CIN || ''}`, 30, 80);
      doc.text(`Téléphone: ${client.telephone || ''}`, 30, 90);
      doc.text(`Ville: ${client.ville || ''}`, 30, 100);

      doc.text('Informations du Véhicule:', 20, 120);
      doc.text(`Marque: ${vehicule.marque || ''}`, 30, 130);
      doc.text(`Modèle: ${vehicule.modele || ''}`, 30, 140);
      doc.text(`Kilométrage initial: ${location.kilometrageDebut || 0} km`, 30, 150);

      doc.text('Détails de la Location:', 20, 170);
      doc.text(`Date de début: ${new Date(location.startDate).toLocaleDateString('fr-FR')}`, 30, 180);
      doc.text(`Date de fin: ${new Date(location.endDate).toLocaleDateString('fr-FR')}`, 30, 190);
      doc.text(`Prix TTC: ${location.prixTTC || 0} TND`, 30, 200);
      doc.text(`Type de garantie: ${location.typeGarantie || ''}`, 30, 210);
      if (location.typeGarantie === 'montant') {
        doc.text(`Montant de la garantie: ${location.montantGarantie || 0} TND`, 30, 220);
      }

      // Convert PDF to Blob
      const pdfBlob = doc.output('blob');
      console.log('PDF generated, size:', pdfBlob.size);

      // Create FormData for sending
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `contract_${locationId}.pdf`);
      formData.append('locationId', locationId);
      console.log('FormData created with locationId:', locationId);

      // Log FormData entries for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData entry: ${key} =`, value);
      }

      console.log('Sending POST request to http://localhost:5000/api/contracts/upload');
      const response = await axios.post('http://localhost:5000/api/contracts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });

      console.log('API response:', response.data);
      toast.success('Contrat généré et envoyé avec succès !');
      await fetchAllData();
    } catch (error) {
      console.error('Erreur lors de la génération/envoi du contrat:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : 'No response received',
        request: error.request ? error.request : 'No request details available',
        config: error.config ? error.config : 'No config available'
      });

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la génération/envoi du contrat';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('Contract generation process completed, loading set to false');
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cinValide) {
      toast.error("Veuillez entrer un CIN valide");
      return;
    }

    if (formData.typeGarantie === "montant" && formData.montantGarantie <= 500) {
      toast.error("Le montant de la garantie doit être supérieur à 500 DT");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error("La date de fin doit être après la date de début");
      return;
    }

    setLoading(true);
    try {
      let overrideBlacklist = false;
      let existingClient = null;

      try {
        const response = await axios.get(`${API_CLIENTS}?cin=${formData.clientCIN}`);
        existingClient = response.data.length > 0 ? response.data[0] : null;
      } catch (error) {
        console.error("Erreur lors de la recherche du client:", error);
        toast.error('Erreur lors de la recherche du client');
      }

      if (existingClient && existingClient.blacklisted) {
        const confirm = window.confirm("⚠️ Ce client est dans la liste noire. Voulez-vous vraiment continuer ?");
        if (!confirm) {
          setLoading(false);
          return;
        }
        overrideBlacklist = true;
      }

      const locationData = {
        vehiculeId: formData.vehiculeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        client: {
          CIN: formData.clientCIN,
          nom: formData.clientNom,
          prenom: formData.clientPrenom,
          telephone: formData.telephone,
          ville: formData.ville
        },
        kilometrageDebut: formData.kilometrageDebut || 0,
        prixTotal: formData.prixTotal,
        prixParJour: formData.prixParJour,
        typeGarantie: formData.typeGarantie,
        montantGarantie: formData.montantGarantie,
        overrideBlacklist
      };

      console.log("Données envoyées au serveur:", locationData);
      const response = await axios.post(API_LOCATIONS, locationData);

      toast.success(`Location ajoutée avec succès pour ${formData.clientPrenom} ${formData.clientNom} !`);
      await fetchAllData();
      setShowForm(false);

      setFormData({
        vehiculeId: '',
        clientCIN: '',
        clientPrenom: '',
        clientNom: '',
        telephone: '',
        ville: '',
        startDate: '',
        endDate: '',
        prixTotal: 0,
        prixParJour: 0,
        kilometrageDebut: '',
        typeGarantie: '',
        montantGarantie: ''
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de la location", error);
      let errorMessage = "Erreur lors de l'ajout de la location";
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container location-page">
      <h1 className="title">Gestion des Locations</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="btn btn-success toggle-form-btn"
      >
        {showForm ? 'Fermer le formulaire' : 'Ajouter une Location'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-container">
          <h2 className="subtitle">Nouvelle Location</h2>

          <div className="form-grid">
            <div className="form-group">
              <label>CIN</label>
              <input
                type="text"
                name="clientCIN"
                value={formData.clientCIN}
                onChange={handleChange}
                maxLength={8}
                pattern="\d{8}"
                required
              />
              {cinMessage && <p style={{ color: 'red', fontSize: '12px' }}>{cinMessage}</p>}
            </div>

            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="clientPrenom"
                value={formData.clientPrenom}
                onChange={handleChange}
                required
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="clientNom"
                value={formData.clientNom}
                onChange={handleChange}
                required
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Véhicule</label>
              <select
                name="vehiculeId"
                value={formData.vehiculeId}
                onChange={handleChange}
                required
                disabled={!cinValide}
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicules
                  .filter(v => v.statut === 'Disponible')
                  .map(v => (
                    <option key={v._id} value={v._id}>
                      {v.marque} {v.modele} — {v.prixParJour} DT/jour
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date de début</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                required
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Date de fin</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Kilométrage début</label>
              <input
                type="number"
                name="kilometrageDebut"
                value={formData.kilometrageDebut}
                onChange={handleChange}
                min="0"
                required
                disabled={!cinValide}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>Prix TTC (DT)</label>
              <input
                type="number"
                name="prixTTC"
                value={formData.prixTTC}
                readOnly
                className="readonly-input"
                disabled={!cinValide}
              />
            </div>

            <div className="form-group">
              <label>Type de garantie</label>
              <select
                name="typeGarantie"
                value={formData.typeGarantie}
                onChange={handleChange}
                required
                disabled={!cinValide}
              >
                <option value="">Sélectionner un type</option>
                <option value="cin">CIN</option>
                <option value="montant">Montant</option>
              </select>
            </div>

            {formData.typeGarantie === "montant" && (
              <div className="form-group">
                <label>Montant de la garantie (DT) *</label>
                <input
                  type="number"
                  name="montantGarantie"
                  value={formData.montantGarantie}
                  onChange={handleChange}
                  min="501"
                  step="1"
                  required
                  disabled={!cinValide}
                />
                {formData.montantGarantie && formData.montantGarantie <= 500 && (
                  <p className="error-message">Le montant doit être supérieur à 500 DT</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      <div className="locations-list">
        <h2 className="subtitle">Locations en cours</h2>
        <div className="table-responsive">
          <table className="location-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Véhicule</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Prix total (TTC)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations
                .filter(loc => loc.statut === 'active')
                .map(location => {
                  const client = location.client || {};
                  const vehicule = location.vehiculeId || {};

                  const formatDate = (date) => {
                    try {
                      return date ? new Date(date).toLocaleDateString('fr-FR') : 'N/A';
                    } catch {
                      return 'Date invalide';
                    }
                  };

                  const prixTotal = location.prixTTC || 0;

                  return (
                    <tr key={location._id}>
                      <td>
                        {client.prenom} {client.nom}
                      </td>
                      <td>
                        {vehicule.marque} {vehicule.modele || 'Véhicule inconnu'}
                      </td>
                      <td>{formatDate(location.startDate)}</td>
                      <td>{formatDate(location.endDate)}</td>
                      <td>{prixTotal} TND</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => generateAndSendContract(location._id)}
                          disabled={loading}
                          style={{ marginRight: '10px' }}
                        >
                          Générer Contrat
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleTerminate(location)}
                          disabled={loading}
                        >
                          Terminer
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;