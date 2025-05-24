import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import "../styles/GestionVehicules.css";
import { API_VEHICULES } from "../api";
import { ToastContainer, toast } from 'react-toastify';


const GestionVehicules = () => {
    const [vehicules, setVehicules] = useState([]);
    const [filteredVehicules, setFilteredVehicules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [modeles, setModeles] = useState([]);
    const debounceTimer = useRef(null);
    const [filterMinPrice, setFilterMinPrice] = useState("");
    const [filterMaxPrice, setFilterMaxPrice] = useState("");
    const [isAutreModele, setIsAutreModele] = useState(false);
    const [isImmatriculationValid, setIsImmatriculationValid] = useState(true);


    const [formData, setFormData] = useState({
        marque: "",
        modele: "",
        immatriculation: "",
        annee: "",
        kilometrage: "",
        carburant: "",
        statut: "Disponible",
        assurance: "",
        prixParJour: "",
        raisonPanne: "",
        dateReparation: ""
    });
    

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatut, setFilterStatut] = useState("");

    const fetchVehicules = async () => {
        try {
            const { data } = await axios.get(API_VEHICULES);
            setVehicules(data);
            setFilteredVehicules(data);
            console.log(data);
        } catch (err) {
            setError("Erreur lors du chargement des véhicules");
        } finally {
            setLoading(false);
        }
    };

    const fetchModelesByMarque = async (marque) => {
        if (!marque) {
            setModeles([]);
            setIsAutreModele(false);
            return;
        }
    
        console.log("Requête pour la marque:", marque);  
    
        try {
            const response = await axios.get(`${API_VEHICULES}/modele/${encodeURIComponent(marque)}`, {
                validateStatus: function (status) {
                    return status >= 200 && status < 500;  
                }
            });
    
            console.log("Réponse API:", response);  
    
            if (response.status === 200 && Array.isArray(response.data)) {
                setModeles([...response.data, "Autre"]);
            } else {
                setModeles(["Autre"]);
            }
        } catch (error) {
            console.error("Erreur de requête:", error);
            setModeles(["Autre"]);
        }
    };
    
    const applyFilters = useCallback(() => {
        let filtered = [...vehicules];
    
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(v => (
                v.marque.toLowerCase().includes(term) ||
                v.modele.toLowerCase().includes(term) ||
                v.immatriculation.toLowerCase().includes(term)
            ));
        }
    
        if (filterStatut) {
            filtered = filtered.filter(v => v.statut === filterStatut);
        }
    
        if (filterMinPrice) {
            const minPrice = parseFloat(filterMinPrice);
            filtered = filtered.filter(v => v.prixParJour >= minPrice);
        }
    
        if (filterMaxPrice) {
            const maxPrice = parseFloat(filterMaxPrice);
            filtered = filtered.filter(v => v.prixParJour <= maxPrice);
        }
    
        // Tri des véhicules: "Loué" et "En maintenance"/"En panne" en haut
        filtered.sort((a, b) => {
            // Véhicules loués et en maintenance en premier
            if ((a.statut === "Loué" || a.statut === "En panne" || a.statut === "En maintenance") && 
                (b.statut !== "Loué" && b.statut !== "En panne" && b.statut !== "En maintenance")) {
                return -1;
            }
            // Véhicules disponibles en dernier
            if ((a.statut !== "Loué" && a.statut !== "En panne" && a.statut !== "En maintenance") && 
                (b.statut === "Loué" || b.statut === "En panne" || b.statut === "En maintenance")) {
                return 1;
            }
            // Maintenir l'ordre pour les véhicules de même statut
            return 0;
        });
    
        setFilteredVehicules(filtered);
    }, [vehicules, searchTerm, filterStatut, filterMinPrice, filterMaxPrice]);

    useEffect(() => {
        const checkExpiredDates = () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
    
            vehicules.forEach(vehicule => {
                if (vehicule.assurance) {
                    const assuranceDate = new Date(vehicule.assurance);
                    if (assuranceDate <= today) {
                        toast.warning(`L'assurance du véhicule ${vehicule.immatriculation} est expirée!`, {
                            autoClose: false,
                            toastId: `assurance-${vehicule._id}`
                        });
                    }
                }
    
              
            });
        };
    
        if (vehicules.length > 0) {
            checkExpiredDates();
        }
    }, [vehicules]);

    useEffect(() => {
        fetchVehicules();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filterStatut, filterMinPrice, filterMaxPrice, vehicules, applyFilters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        if (name === "marque") {
            setFormData(prev => ({ ...prev, marque: value, modele: "" })); // reset modèle quand marque change
            setIsAutreModele(false); // reset l'état "Autre"
    
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
            
            debounceTimer.current = setTimeout(() => {
                if (value.trim().length >= 2) {  
                    fetchModelesByMarque(value);
                } else {
                    setModeles([]);
                    setIsAutreModele(false);
                }
            }, 300);
            
            return;
        }
    
        if (name === "modele") {
            if (value === "Autre") {
                setIsAutreModele(true);
                setFormData(prev => ({ ...prev, modele: "" }));
            } else {
                setIsAutreModele(false);
                setFormData(prev => ({ ...prev, modele: value }));
            }
            return;
        }
    
        if (name === "immatriculation") {
            const isValid = validateImmatriculation(value);
            setIsImmatriculationValid(isValid);
        }
    
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    

    const validateImmatriculation = (immatriculation) => {
        const regex = /^\d{3}TUN\d{4}$/;
        return regex.test(immatriculation);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const isValidDate = (dateStr) => {
            const d = new Date(dateStr);
            return d instanceof Date && !isNaN(d);
        }
    
        if (!validateImmatriculation(formData.immatriculation)) {
            toast.error("L'immatriculation doit être au format 123TUN4567");
            return;
        }
    
        if (!isValidDate(formData.assurance) || new Date(formData.assurance) <= today) {
            toast.error("La date d'assurance doit être une date valide dans le futur");
            return;
        }
    
    
    
        try {
            let response;
            if (editingId) {
                response = await axios.put(`${API_VEHICULES}/${editingId}`, formData);
                toast.success("Véhicule modifié avec succès!");
            } else {
                response = await axios.post(API_VEHICULES, formData);
                toast.success("Véhicule ajouté avec succès!");
            }
    
            console.log(response);
            fetchVehicules();
            resetForm();
        } catch (err) {
            console.error('Erreur complète:', err);
            toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement");
        }
    };
    
    
    const resetForm = () => {
        setFormData({
            marque: "",
            modele: "",
            immatriculation: "",
            annee: "",
            kilometrage: "",
            carburant: "",
            statut: "Disponible",
            assurance: "",
            prixParJour: "",
            raisonPanne: "",
            dateReparation: ""
        });
        setEditingId(null);
        setShowForm(false);
        setIsAutreModele(false);
        setModeles([]);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce véhicule ?")) return;

        try {
            await axios.delete(`${API_VEHICULES}/${id}`);
            toast.success("Véhicule supprimé avec succès");
            fetchVehicules();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        }
    };
    
    const handleEdit = (vehicule) => {
        setFormData({
            ...vehicule,
            assurance: vehicule.assurance?.split('T')[0] || "",
            dateReparation: vehicule.dateReparation?.split('T')[0] || ""
        });
        setEditingId(vehicule._id);
        setShowForm(true);
        fetchModelesByMarque(vehicule.marque);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleFilterChange = (e) => {
        setFilterStatut(e.target.value);
    };

    const handlePriceFilterChange = (e, type) => {
        const value = e.target.value;
        if (type === 'min') {
            setFilterMinPrice(value);
        } else {
            setFilterMaxPrice(value);
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.autoTable({
            head: [['Marque', 'Modèle', 'Immatriculation', 'Statut', 'Kilométrage', 'Prix/jour']],
            body: filteredVehicules.map(v => [
                v.marque,
                v.modele,
                v.immatriculation,
                v.statut,
                `${v.kilometrage} km`,
                `${v.prixParJour} DT`
            ])
        });
        doc.save('liste_vehicules.pdf');
    };

    // Fonction pour déterminer la classe CSS de la ligne selon le statut du véhicule
    const getRowClassName = (statut) => {
        if (statut === "Loué" || statut === "En panne" || statut === "En maintenance") {
            return "priority-vehicle";
        }
        return "";
    };

    return (
        <div className="gestion-vehicules">
            <h2> Liste des véhicules</h2>
            <ToastContainer position="top-right" />
            {error && <div className="error">{error}</div>}
            {successMsg && <div className="success">{successMsg}</div>}

            <div className="controls">
                <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={handleSearch}
                />

                <div className="price-filters">
                    <input
                        type="number"
                        placeholder="Prix min"
                        value={filterMinPrice}
                        onChange={(e) => handlePriceFilterChange(e, 'min')}
                    />
                    <input
                        type="number"
                        placeholder="Prix max"
                        value={filterMaxPrice}
                        onChange={(e) => handlePriceFilterChange(e, 'max')}
                    />
                </div>

                <select value={filterStatut} onChange={handleFilterChange}>
                    <option value="">Tous les statuts</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Loué">Loué</option>
                    <option value="En panne">En panne</option>
                    <option value="En maintenance">En maintenance</option>
                </select>

                <button onClick={exportToPDF}>Exporter PDF</button>
                <button onClick={() => setShowForm(!showForm)}>
                    {showForm ? "Annuler" : "Ajouter véhicule"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit}>
                    <h3>{editingId ? "Modifier véhicule" : "Ajouter véhicule"}</h3>

                    <div className="form-group">
                        <label>Marque</label>
                        <input 
                            name="marque" 
                            value={formData.marque} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Modèle</label>
                        <select
                            name="modele"
                            value={formData.modele}
                            onChange={handleChange}
                            disabled={modeles.length === 0}
                        >
                            <option value="">Sélectionner un modèle</option>
                            {modeles.map((mod, index) => (
                                <option key={index} value={mod}>{mod}</option>
                            ))}
                        </select>

                        {isAutreModele && (
                            <input
                                type="text"
                                placeholder="Saisir le modèle"
                                name="modele"
                                value={formData.modele}
                                onChange={handleChange}
                            />
                        )}
                    </div>
                    <div className="form-group">
                        <label>Immatriculation</label>
                        <input 
                            name="immatriculation" 
                            value={formData.immatriculation} 
                            onChange={handleChange} 
                            required
                            className={formData.immatriculation && !validateImmatriculation(formData.immatriculation) ? "error" : ""}
                        />
                        {formData.immatriculation && !validateImmatriculation(formData.immatriculation) && (
                            <small className="error-text">Format: 123TUN4567</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Année</label>
                        <input 
                            type="number" 
                            name="annee" 
                            value={formData.annee} 
                            onChange={handleChange} 
                            required 
                            min="2010"
                            max={new Date().getFullYear()}
                            disabled={!isImmatriculationValid}
                        />
                    </div>  

                    <div className="form-group">
                        <label>Kilométrage</label>
                        <input 
                            type="number" 
                            name="kilometrage" 
                            value={formData.kilometrage} 
                            onChange={handleChange} 
                            required 
                            min="0"
                            disabled={!isImmatriculationValid}
                        />
                    </div>

                    <div className="form-group">
                        <label>Carburant</label>
                        <select 
                            name="carburant" 
                            value={formData.carburant} 
                            onChange={handleChange} 
                            disabled={!isImmatriculationValid}
                            required
                        >
                            <option value="">-- Sélectionner --</option>
                            <option value="Essence">Essence</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Hybride">Hybride</option>
                            <option value="Electrique">Électrique</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Statut</label>
                        <select 
                            name="statut" 
                            value={formData.statut} 
                            onChange={handleChange}
                            disabled={!isImmatriculationValid}
                        >
                            <option value="Disponible">Disponible</option>
                            <option value="Loué">Loué</option>
                            <option value="En panne">En panne</option>
                            <option value="En maintenance">En maintenance</option>
                        </select>
                    </div>

                    {(formData.statut === "En panne" || formData.statut === "En maintenance") && (
                        <>
                            <div className="form-group">
                                <label>Raison de la panne</label>
                                <input 
                                    name="raisonPanne" 
                                    value={formData.raisonPanne} 
                                    onChange={handleChange} 
                                    disabled={!isImmatriculationValid}
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label>Date réparation</label>
                                <input 
                                    type="date" 
                                    name="dateReparation" 
                                    value={formData.dateReparation} 
                                    onChange={handleChange} 
                                    min={new Date().toISOString().split('T')[0]}
                                    disabled={!isImmatriculationValid}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Date assurance</label>
                        <input
                            type="date"
                            name="assurance"
                            value={formData.assurance}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            disabled={!isImmatriculationValid}
                            required
                        />
                    </div>

                   
                    <div className="form-group">
                        <label>Prix par jour (DT)</label>
                        <input 
                            type="number" 
                            name="prixParJour" 
                            value={formData.prixParJour} 
                            onChange={handleChange} 
                            disabled={!isImmatriculationValid}
                            required 
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="submit">{editingId ? "Modifier" : "Ajouter"}</button>
                        <button type="button" onClick={resetForm}>Annuler</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div className="loading">Chargement...</div>
            ) : filteredVehicules.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            <th>Marque</th>
                            <th>Modèle</th>
                            <th>Immatriculation</th>
                            <th>Statut</th>
                            <th>Kilométrage</th>
                            <th>Prix/jour</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVehicules.map(vehicule => (
                            <tr key={vehicule._id} className={getRowClassName(vehicule.statut)}>
                                <td>{vehicule.marque}</td>
                                <td>{vehicule.modele}</td>
                                <td>{vehicule.immatriculation}</td>
                                <td>{vehicule.statut}</td>
                                <td>{vehicule.kilometrage} km</td>
                                <td>{vehicule.prixParJour} DT</td>
                                <td>
                                    <button 
                                        onClick={() => handleEdit(vehicule)}
                                        disabled={vehicule.statut === "Loué" || vehicule.statut === "En maintenance"}
                                    >
                                        Modifier
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(vehicule._id)} 
                                        disabled={vehicule.statut === "Loué" || vehicule.statut === "En maintenance"}
                                    >
                                        Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-results">Aucun véhicule trouvé</div>
            )}
        </div>
    );
};

export default GestionVehicules;