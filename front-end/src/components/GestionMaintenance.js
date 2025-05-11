import React, { useState, useEffect } from "react";
import { fetchVehicules, fetchMaintenances, addMaintenance, terminerMaintenance } from "../api";
import "../styles/GestionMaintenance.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GestionMaintenance = () => {
    const [maintenances, setMaintenances] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        date: "",
        date_realisée: "",
        type: "",
        cout: "",
        vehicule: "",
        description: ""
    });
    const [isFormVisible, setIsFormVisible] = useState(false);

    const formatDate = (isoDate) => {
        if (!isoDate) return "Non spécifiée";
        const date = new Date(isoDate);
        return date.toLocaleDateString("fr-FR");
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const [vehiculesData, maintenancesData] = await Promise.all([
                    fetchVehicules(),
                    fetchMaintenances()
                ]);

                console.log("Fetched maintenances:", maintenancesData);
                setVehicules(vehiculesData);
                setMaintenances(maintenancesData);

                vehiculesData.forEach(v => {
                    const vidangeEffectuée = maintenancesData.some(m =>
                        m.vehicule === v._id && m.type === "Vidange" && m.date_realisée
                    );

                    if (!vidangeEffectuée && v.kilometrage - v.dernierKilometrageVidange >= 10000) {
                        toast.warn(
                            <div>
                                <strong>🚨 Vidange nécessaire !</strong>
                                <p>{v.marque} {v.modele} ({v.immatriculation})</p>
                                <p>Kilométrage actuel: {v.kilometrage} km</p>
                                <p>Dernière vidange: {v.dernierKilometrageVidange} km</p>
                            </div>,
                            {
                                autoClose: false,
                                closeOnClick: true,
                                closeButton: true,
                                toastId: `vidange-${v._id}`
                            }
                        );
                    }
                });
            } catch (error) {
                console.error("Erreur lors du chargement des données", error);
                toast.error("Erreur lors du chargement des données");
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "type") {
            const today = new Date().toISOString().split("T")[0];
            if (value === "Vidange" || value === "Lavage") {
                setFormData(prev => ({
                    ...prev,
                    type: value,
                    date: today,
                    date_realisée: today,
                    description: ""
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    type: value,
                    date: "",
                    date_realisée: "",
                    description: ""
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { date, type, cout, vehicule, description, date_realisée } = formData;

        if (!date || !type || !cout || !vehicule) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        if (type !== "Vidange" && type !== "Lavage" && !date_realisée) {
            toast.error("Veuillez spécifier la date réalisée");
            return;
        }

        try {
            const newMaintenance = await addMaintenance({
                date,
                date_realisée: date_realisée || null,
                type,
                description: description || "",
                cout: parseFloat(cout),
                vehicule
            });

            setMaintenances(prev => [...prev, newMaintenance]);

            setFormData({
                date: "",
                date_realisée: "",
                type: "",
                cout: "",
                vehicule: "",
                description: ""
            });

            setIsFormVisible(false);

            toast.success("Maintenance ajoutée avec succès !");
        } catch (error) {
            console.error("Erreur lors de l'ajout de la maintenance", error);
            toast.error("Échec de l'ajout de la maintenance");
        }
    };

    const handleTerminerMaintenance = async (maintenanceId) => {
        
        try {
            const updatedMaintenance = await terminerMaintenance(maintenanceId);

            setMaintenances(prev =>
                prev.map((m) =>
                    m._id === maintenanceId ? updatedMaintenance : m
                )
            );

            toast.success("Maintenance terminée avec succès !");
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la maintenance", error);
            toast.error("Échec de la mise à jour de la maintenance");
        }
    };

    const filteredMaintenances = maintenances.filter(m => {
        const search = searchTerm.toLowerCase();
        const vehicleInfo = m.vehicule ? 
            `${m.vehicule.marque} ${m.vehicule.modele} ${m.vehicule.immatriculation}`.toLowerCase() : "";
        const maintenanceType = m.type ? m.type.toLowerCase() : "";
    
        // Vérifier que la maintenance n'est pas terminée avant de l'inclure dans les résultats
        const isMaintenanceActive = m.statut !== 'Terminée';
    
        // Retourner les maintenances actives qui correspondent au terme de recherche
        return isMaintenanceActive && (maintenanceType.includes(search) || vehicleInfo.includes(search));
    });
    
    return (
        <div className="maintenance-container">
            <ToastContainer position="bottom-right" />
            <h1 className="maintenance-title">Gestion des Maintenances</h1>

            <div className="controls-section">
                <input
                    type="text"
                    placeholder="Rechercher maintenance..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button
                    onClick={() => setIsFormVisible(!isFormVisible)}
                    className="add-button"
                >
                    {isFormVisible ? "Annuler" : "Ajouter une Maintenance"}
                </button>
            </div>

            {isFormVisible && (
    <div className="form-section">
        <h2>Ajouter une Maintenance</h2>
        <form onSubmit={handleSubmit} className="maintenance-form">
            {/* Véhicule */}
            <div className="form-group">
                <label>Véhicule *</label>
                <select
                    name="vehicule"
                    value={formData.vehicule}
                    onChange={handleChange}
                    required
                >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicules.map(veh => (
                        <option key={veh._id} value={veh._id}>
                            {veh.marque} {veh.modele} ({veh.immatriculation})
                        </option>
                    ))}
                </select>
            </div>

            {/* Date prévue */}
            <div className="form-group">
                <label>Date prévue *</label>
                <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={formData.type === "Vidange" || formData.type === "Lavage"}
                    required
                />
            </div>

            {/* Date réalisée */}
            <div className="form-group">
                <label>Date réalisée</label>
                <input
                    type="date"
                    name="date_realisée"
                    value={formData.date_realisée}
                    onChange={handleChange}
                    disabled={formData.type === "Vidange" || formData.type === "Lavage"}
                    required={formData.type !== "Vidange" && formData.type !== "Lavage" && formData.date}
                />
            </div>

            {/* Type de maintenance */}
            <div className="form-group">
                <label>Type de maintenance *</label>
                <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                >
                    <option value="">Sélectionner un type</option>
                    <option value="Vidange">Vidange</option>
                    <option value="Lavage">Lavage</option>
                    <option value="Panne">Panne</option>
                    <option value="Autre">Autre</option>
                </select>
            </div>

            {/* Description pour "Autre" */}
            {formData.type === "Autre" && (
                <div className="form-group">
                    <label>Description *</label>
                    <input
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>
            )}

            {/* Coût */}
            <div className="form-group">
                <label>Coût (DT) *</label>
                <input
                    type="number"
                    name="cout"
                    value={formData.cout}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                />
            </div>

            {/* Actions */}
            <div className="form-actions">
                <button type="submit" className="submit-button">Enregistrer</button>
                <button
                    type="button"
                    onClick={() => setIsFormVisible(false)}
                    className="cancel-button"
                >
                    Annuler
                </button>
            </div>
        </form>
    </div>
)}

{/* Liste des maintenances */}
<div className="maintenances-section">
    <h2>Liste des Maintenances</h2>
    <div className="table-responsive">
        <table className="maintenances-table">
            <thead>
                <tr>
                    <th>Date prévue</th>
                    <th>Date réalisée</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Coût (DT)</th>
                    <th>Véhicule</th>
                    <th>Statut</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {filteredMaintenances.map((m, index) => (
                    <tr key={m._id || index}>
                        <td>{formatDate(m.date)}</td>
                        <td>{formatDate(m.date_realisée)}</td>
                        <td>{m.type}</td>
                        <td>{m.description || "-"}</td>
                        <td>{m.cout} DT</td>
                        <td>{m.vehicule ? `${m.vehicule.marque} ${m.vehicule.modele}` : "Inconnu"}</td>
                        <td>{m.date_realisée ? "Terminé" : "En attente"}</td>
                        <td>
                            {!m.date_realisée && (
                                <button
                                    className="terminate-button"
                                    onClick={() => handleTerminerMaintenance(m._id)}
                                >
                                    Terminer
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
</div>

        </div>
    );
};

export default GestionMaintenance;
