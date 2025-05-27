import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import '../styles/GestionLocation.css';
import { API_VEHICULES, API_CLIENTS, API_LOCATIONS, API_EVENTS } from '../api';
import { toast } from 'react-toastify';

// Function to load image as base64
const loadImageAsBase64 = (url) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      const reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
};

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
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [telMessage, setTelMessage] = useState('');
  const [telValide, setTelValide] = useState(false);

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
    prixAvantRemise: 0,
    montantRemise: 0,
    kilometrageInitial: '',
    typeGarantie: '',
    montantGarantie: '',
    tauxRemise: '0%',
  });

  // Chargement des données
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [vehiculesRes, clientsRes, locationsRes, eventsRes] = await Promise.all([
        axios.get(API_VEHICULES),
        axios.get(API_CLIENTS),
        axios.get(API_LOCATIONS),
        axios.get(API_EVENTS),
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
        type: 'error',
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
  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === 'clientCIN') {
      const isValid = /^\d{8}$/.test(value);
      setCinValide(isValid);
      setCinMessage(isValid ? '' : 'Le CIN doit contenir exactement 8 chiffres');

      if (isValid) {
        try {
          const response = await axios.get(`${API_CLIENTS}/check-blacklist/${value}`);
          const isBlacklisted = response.data.blacklisted;

          setIsBlacklisted(isBlacklisted);

          if (isBlacklisted) {
            toast.error('Ce client est dans la liste noire. Impossible de faire une location.');
            setFormData((prev) => ({
              ...prev,
              vehiculeId: '',
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
              prixAvantRemise: 0,
              montantRemise: 0,
              tauxRemise: '0%',
              kilometrageInitial: '',
              typeGarantie: '',
              montantGarantie: '',
            }));
          } else {
            if (response.data.client) {
              setFormData((prev) => ({
                ...prev,
                clientNom: response.data.client.nom || '',
                clientPrenom: response.data.client.prenom || '',
                telephone: response.data.client.telephone || '',
                ville: response.data.client.ville || '',
              }));

              const telLoaded = response.data.client.telephone || '';
              const isTelValid = /^\d{8}$/.test(telLoaded);
              setTelValide(isTelValid);
              setTelMessage(isValid ? '' : 'Le téléphone doit contenir exactement 8 chiffres');
            }
          }
        } catch (error) {
          console.error('Erreur vérification blacklist:', error);
          setIsBlacklisted(false);
        }
      } else {
        setIsBlacklisted(false);
      }
    }

    if (name === 'telephone') {
      const isTelValid = /^\d{8}$/.test(value);
      setTelValide(isTelValid);
      setTelMessage(isTelValid ? '' : 'Le téléphone doit contenir exactement 8 chiffres');
    }

    const processedValue = ['prixTotal', 'prixParJour', 'prixHT', 'prixTTC', 'montantGarantie', 'prixAvantRemise', 'montantRemise'].includes(name)
      ? parseFloat(value) || 0
      : ['kilometrageInitial'].includes(name)
        ? parseInt(value) || 0
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  // Mise à jour du kilométrage initial quand véhicule change
  useEffect(() => {
    if (formData.vehiculeId) {
      const selectedVehicule = vehicules.find((v) => v._id === formData.vehiculeId);
      if (selectedVehicule) {
        setFormData((prev) => ({
          ...prev,
          kilometrageInitial: selectedVehicule.kilometrage || 0,
          prixParJour: selectedVehicule.prixParJour || 0,
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

        const vehicule = vehicules.find((v) => v._id === vehiculeId);
        const client = clients.find((c) => c.CIN === clientCIN);

        if (!vehicule?.prixParJour || isNaN(vehicule.prixParJour)) return;

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const diffTime = end - start;
        const days = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);

        let prixAvantRemise = days * vehicule.prixParJour;
        let montantRemise = 0;
        let tauxRemise = '0%';
        let prixHT = prixAvantRemise;

        if (client?.fidelityStatus === 'VIP') {
          montantRemise = prixAvantRemise * 0.2;
          prixHT = prixAvantRemise - montantRemise;
          tauxRemise = '20%';
        } else if (client?.fidelityStatus === '10% de remise') {
          montantRemise = prixAvantRemise * 0.1;
          prixHT = prixAvantRemise - montantRemise;
          tauxRemise = '10%';
        }

        const TVA_RATE = 0.19;
        const prixTTC = prixHT + prixHT * TVA_RATE;

        const newData = {
          prixAvantRemise: parseFloat(prixAvantRemise.toFixed(2)),
          montantRemise: parseFloat(montantRemise.toFixed(2)),
          prixHT: parseFloat(prixHT.toFixed(2)),
          prixTTC: parseFloat(prixTTC.toFixed(2)),
          tauxRemise,
        };

        const hasChanged = Object.entries(newData).some(([key, value]) => formData[key] !== value);

        if (hasChanged) {
          setFormData((prev) => ({
            ...prev,
            ...newData,
          }));
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
        if (!formData.clientCIN || !clients?.length || isBlacklisted) return;

        const client = clients.find((c) => c.CIN === formData.clientCIN);

        if (!client) {
          setFormData((prev) => ({
            ...prev,
            clientNom: '',
            clientPrenom: '',
            telephone: '',
            ville: '',
          }));
          toast.warn('Aucun client trouvé pour ce CIN');
          return;
        }

        const telLoaded = client.telephone ?? '';
        const isTelValid = /^\d{8}$/.test(telLoaded);

        setTelValide(isTelValid);
        setTelMessage(isTelValid ? '' : 'Le téléphone doit contenir exactement 8 chiffres');

        setFormData((prev) => ({
          ...prev,
          clientNom: client.nom ?? '',
          clientPrenom: client.prenom ?? '',
          telephone: client.telephone ?? '',
          ville: client.ville ?? '',
        }));
        toast.success(`Informations du client ${client.prenom} ${client.nom} chargées !`);
      } catch (error) {
        console.error('Erreur dans la mise à jour des infos client:', error);
        toast.error('Erreur lors de la mise à jour des informations du client');
      }
    };

    updateClientInfo();
  }, [formData.clientCIN, clients, isBlacklisted]);

  // Terminer une location
  const handleTerminate = async (location) => {
    try {
      const locationId = location._id;
      const kilometrageInitial = location.kilometrageInitial ?? location.vehiculeId?.kilometrage ?? 0;

      if (kilometrageInitial === null || kilometrageInitial === undefined) {
        toast.error('Kilométrage initial non disponible.');
        return;
      }

      let isValid = false;
      let kilometrageFinal;
      let distanceParcourue = 0;

      while (!isValid) {
        const input = prompt(
          `Kilométrage initial: ${kilometrageInitial}\nEntrez le kilométrage final (doit être > ${kilometrageInitial}):`
        );

        if (input === null) return;
        kilometrageFinal = parseFloat(input);

        if (isNaN(kilometrageFinal)) {
          toast.error('Veuillez entrer un nombre valide pour le kilométrage final.');
          continue;
        }

        if (kilometrageFinal <= kilometrageInitial) {
          toast.error(
            `Erreur: Le kilométrage final (${kilometrageFinal}) doit être supérieur au kilométrage initial (${kilometrageInitial}).`
          );
          continue;
        }

        distanceParcourue = kilometrageFinal - kilometrageInitial;
        isValid = true;
      }

      await axios.put(`${API_LOCATIONS}/${locationId}/terminer`, { kilometrageFinal });
      await fetchAllData();
      toast.success(`Location terminée avec succès ! Distance parcourue : ${distanceParcourue.toFixed(2)} km`);
    } catch (error) {
      console.error('Erreur lors de la terminaison:', error);
      toast.error('Une erreur est survenue lors de la terminaison de la location.');
    }
  };

  // Generate and send contract PDF
  const generateAndSendContract = async (locationId) => {
    console.log('Starting generateAndSendContract for locationId:', locationId);

    const location = locations.find((loc) => loc._id === locationId);
    if (!location) {
      console.error('Location not found for ID:', locationId);
      toast.error('Location non trouvée.');
      return;
    }

    console.log('Location data:', JSON.stringify(location, null, 2));

    // Validate required fields
    if (typeof location.kilometrageInitial === 'undefined') {
      console.error('Missing required field: kilometrageInitial');
      toast.error('Données incomplètes : kilométrage initial manquant.');
      return;
    }
    if (!location.typeGarantie) {
      console.warn('Type de garantie manquant, using default: "cin"');
      location.typeGarantie = 'cin';
    }

    const client = location.client || location.clientId || {};
    const vehicule = location.vehicule || location.vehiculeId || {};

    try {
      setLoading(true);
      console.log('Generating PDF for location:', locationId);

      // Create new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Define colors
      const primaryColor = '#E0E0E0'; // Deep blue
      const primaryColor2 = '#003087'; // Deep blue
      const secondaryColor = '#E0E0E0'; // Light gray
      const textColor = '#333333'; // Dark gray
      const backgroundColor = '#F8F9FA'; // Light background

      // Add header background
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 30, 'F');

      // Load and add logo
      try {
        const logoUrl = '/LogoRemove.png';
        const logoBase64 = await loadImageAsBase64(logoUrl);
        doc.addImage(logoBase64, 'PNG', 10, 5, 40, 20); // Logo top-left
      } catch (error) {
        console.warn('Failed to load logo:', error.message);
        toast.warn('Impossible de charger le logo, génération du contrat sans logo.');
      }

      // Header text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor('#003087');
      doc.text('Contrat de Location de Véhicule', 105, 20, { align: 'center' });

      // Subheader details
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 190, 35, { align: 'right' });

    

      // Client Information
      doc.setFillColor(backgroundColor);
      doc.rect(10, 45, 190, 40, 'F');
      doc.setDrawColor(secondaryColor);
      doc.rect(10, 45, 190, 40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor2);
      doc.text('Informations du Client', 15, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.text(`Nom: ${client.prenom || ''} ${client.nom || ''}`, 15, 58);
      doc.text(`CIN: ${client.CIN || ''}`, 15, 64);
      doc.text(`Téléphone: ${client.telephone || ''}`, 15, 70);
      doc.text(`Ville: ${client.ville || ''}`, 15, 76);

      // Vehicle Information
      doc.setFillColor(backgroundColor);
      doc.rect(10, 90, 190, 30, 'F');
      doc.setDrawColor(secondaryColor);
      doc.rect(10, 90, 190, 30);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor2);
      doc.text('Informations du Véhicule', 15, 95);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.text(`Marque: ${vehicule.marque || ''}`, 15, 103);
      doc.text(`Modèle: ${vehicule.modele || ''}`, 15, 109);
      doc.text(`Kilométrage initial: ${location.kilometrageInitial} km`, 15, 115);

      // Rental Details
      doc.setFillColor(backgroundColor);
      doc.rect(10, 125, 190, 40, 'F');
      doc.setDrawColor(secondaryColor);
      doc.rect(10, 125, 190, 40);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor2);
      doc.text('Détails de la Location', 15, 130);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.text(`Date de début: ${new Date(location.startDate).toLocaleDateString('fr-FR')}`, 15, 138);
      doc.text(`Date de fin: ${new Date(location.endDate).toLocaleDateString('fr-FR')}`, 15, 144);
      doc.text(`Prix TTC: ${location.prixTTC || 0} TND`, 15, 150);
      doc.text(`Type de garantie: ${location.typeGarantie}`, 15, 156);
      if (location.typeGarantie === 'montant') {
        doc.text(`Montant de la garantie: ${location.montantGarantie || 0} TND`, 15, 162);
      }

      // General Terms
      doc.setFillColor(backgroundColor);
      doc.rect(10, 170, 190, 50, 'F');
      doc.setDrawColor(secondaryColor);
      doc.rect(10, 170, 190, 50);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor2);
      doc.text('Conditions Générales', 15, 175);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      const terms = [
        '1. Le locataire s’engage à restituer le véhicule dans l’état où il l’a reçu, sauf usure normale.',
        '2. Toute prolongation de la location doit être approuvée par le loueur.',
        '3. Le locataire est responsable de toutes amendes ou infractions commises pendant la période de location.',
        '4. En cas de dommages au véhicule, le locataire doit en informer le loueur immédiatement.',
      ];
      terms.forEach((term, index) => {
        doc.text(term, 15, 183 + index * 8);
      });

      // Signatures
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor2);
      doc.text('Signatures', 15, 230);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor);
      doc.text('Loueur:', 15, 238);
      doc.line(35, 238, 85, 238);
      doc.text('Locataire:', 105, 238);
      doc.line(125, 238, 175, 238);

      // Footer
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(textColor);
      doc.text('Skydrive Location - Contrat de Location', 105, 280, { align: 'center' });
      doc.text('Page 1/1', 190, 280, { align: 'right' });

      // Convert PDF to Blob
      const pdfBlob = doc.output('blob');
      console.log('PDF generated, size:', pdfBlob.size);

      // Create FormData for sending
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `contract_${locationId}.pdf`);
      formData.append('locationId', locationId);
      console.log('FormData created with locationId:', locationId);

      // Send PDF
      console.log('Sending POST request to http://localhost:5000/api/contracts/upload');
      const response = await axios.post('http://localhost:5000/api/contracts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });

      console.log('API response:', response.data);
      toast.success('Contrat généré et envoyé avec succès !');

      // Open PDF in new tab
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

      await fetchAllData();
    } catch (error) {
      console.error('Erreur lors de la génération/envoi du contrat:', {
        message: error.message,
        code: error.code,
        response: error.response
          ? {
              status: error.response.status,
              data: error.response.data,
              headers: error.response.headers,
            }
          : 'No response received',
        request: error.request ? error.request : 'No request details available',
        config: error.config ? error.config : 'No config available',
      });

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la génération/envoi du contrat';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      console.log('Contract generation process completed, loading set to false');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cinValide) {
      toast.error('Veuillez entrer un CIN valide');
      return;
    }

    if (!telValide) {
      toast.error('Veuillez entrer un numéro de téléphone valide (8 chiffres)');
      return;
    }

    if (formData.typeGarantie === 'montant' && formData.montantGarantie <= 500) {
      toast.error('Le montant de la garantie doit être supérieur à 500 DT');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    if (!formData.kilometrageInitial) {
      toast.error('Le kilométrage initial est requis.');
      return;
    }

    if (!formData.typeGarantie) {
      toast.error('Le type de garantie est requis.');
      return;
    }

    if (isBlacklisted) {
      toast.error('Action impossible : Ce client est dans la liste noire');
      return;
    }

    setLoading(true);

    try {
      const locationData = {
        vehiculeId: formData.vehiculeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        client: {
          CIN: formData.clientCIN,
          nom: formData.clientNom,
          prenom: formData.clientPrenom,
          telephone: formData.telephone,
          ville: formData.ville,
        },
        kilometrageInitial: formData.kilometrageInitial,
        prixTotal: formData.prixTTC,
        prixParJour: formData.prixParJour,
        prixHT: formData.prixHT,
        prixTTC: formData.prixTTC,
        prixAvantRemise: formData.prixAvantRemise,
        montantRemise: formData.montantRemise,
        tauxRemise: formData.tauxRemise,
        typeGarantie: formData.typeGarantie,
        montantGarantie: formData.typeGarantie === 'montant' ? formData.montantGarantie : 0,
      };

      const response = await axios.post(API_LOCATIONS, locationData);

      if (response.data.code === 'CLIENT_BLACKLISTED') {
        toast.error(response.data.message);
        setIsBlacklisted(true);
        return;
      }

      toast.success(`Location ajoutée pour ${formData.clientPrenom} ${formData.clientNom} !`);
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
        prixHT: 0,
        prixTTC: 0,
        prixAvantRemise: 0,
        montantRemise: 0,
        tauxRemise: '0%',
        kilometrageInitial: '',
        typeGarantie: '',
        montantGarantie: '',
      });
    } catch (error) {
      console.error('Erreur location:', error);

      if (error.response?.data?.code === 'CLIENT_BLACKLISTED') {
        toast.error(`Client blacklisté: ${error.response.data.message}`);
        setIsBlacklisted(true);
      } else if (error.response?.status === 403) {
        toast.error('Permission refusée - client blacklisté');
        setIsBlacklisted(true);
      } else {
        toast.error(`Erreur: ${error.response?.data?.message || 'Échec de la location'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container location-page">

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

          {isBlacklisted && (
            <div className="alert alert-danger blacklist-alert">
              <strong>ATTENTION :</strong> Ce client est dans la liste noire ! Impossible de créer une location.
            </div>
          )}

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
                disabled={!cinValide || isBlacklisted}
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
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="text"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
                disabled={!cinValide || isBlacklisted}
                maxLength={8}
                pattern="\d{8}"
                required
              />
              {telMessage && <p style={{ color: 'red', fontSize: '12px' }}>{telMessage}</p>}
            </div>

            <div className="form-group">
              <label>Ville</label>
              <input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Véhicule</label>
              <select
                name="vehiculeId"
                value={formData.vehiculeId}
                onChange={handleChange}
                required
                disabled={!cinValide || isBlacklisted}
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicules
                  .filter((v) => v.statut === 'Disponible')
                  .map((v) => (
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
                disabled={!cinValide || isBlacklisted}
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
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Kilométrage initial</label>
              <input
                type="number"
                name="kilometrageInitial"
                value={formData.kilometrageInitial}
                onChange={handleChange}
                min="0"
                required
                disabled={!cinValide || isBlacklisted}
                readOnly
                className="readonly-input"
              />
            </div>

            <div className="form-group">
              <label>Prix avant remise (DT)</label>
              <input
                type="number"
                name="prixAvantRemise"
                value={formData.prixAvantRemise}
                readOnly
                className="readonly-input"
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Taux de remise</label>
              <input
                type="text"
                name="tauxRemise"
                value={formData.tauxRemise}
                readOnly
                className="readonly-input"
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Montant de la remise (DT)</label>
              <input
                type="number"
                name="montantRemise"
                value={formData.montantRemise}
                readOnly
                className="readonly-input"
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Prix HT après remise (DT)</label>
              <input
                type="number"
                name="prixHT"
                value={formData.prixHT}
                readOnly
                className="readonly-input"
                disabled={!cinValide || isBlacklisted}
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
                disabled={!cinValide || isBlacklisted}
              />
            </div>

            <div className="form-group">
              <label>Type de garantie</label>
              <select
                name="typeGarantie"
                value={formData.typeGarantie}
                onChange={handleChange}
                required
                disabled={!cinValide || isBlacklisted}
              >
                <option value="">Sélectionner un type</option>
                <option value="cin">CIN</option>
                <option value="montant">Montant</option>
              </select>
            </div>

            {formData.typeGarantie === 'montant' && (
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
                disabled={!cinValide || isBlacklisted}
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
            disabled={loading || isBlacklisted || !cinValide || !telValide}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
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
                .filter((loc) => loc.statut === 'active')
                .map((location) => {
                  const client = location.client || location.clientId || {};
                  const vehicule = location.vehicule || location.vehiculeId || {};

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