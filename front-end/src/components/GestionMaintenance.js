import React, { useState, useEffect } from "react";
import { fetchVehicules, fetchMaintenances, addMaintenance, updateMaintenance, deleteMaintenance } from "../api";
import "../styles/GestionMaintenance.css";
import { toast, ToastContainer } from "react-toastify";

const GestionMaintenance = () => {
    const [maintenances, setMaintenances] = useState([]);
    const [vehicules, setVehicules] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState({
        _id: "",
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

                const vehiculesFiltres = vehiculesData.filter(veh => 
                    veh.statut === "Disponible" || veh.statut === "En panne"
                );

                setVehicules(vehiculesFiltres);
                setMaintenances(maintenancesData);
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
                    date_realisée: today
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    type: value,
                    date: "",
                    date_realisée: ""
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
        const { date, type, cout, vehicule, date_realisée, _id } = formData;

        if (!date || !type || !cout || !vehicule) {
            toast.error("Veuillez remplir tous les champs obligatoires (sauf description)");
            return;
        }

        if (type !== "Vidange" && type !== "Lavage" && !date_realisée) {
            toast.error("Veuillez spécifier la date réalisée");
            return;
        }

        try {
            if (_id) {
                const updatedMaintenance = await updateMaintenance(_id, {
                    date,
                    date_realisée: date_realisée || null,
                    type,
                    description: formData.description || "",
                    cout: parseFloat(cout),
                    vehicule
                });

                setMaintenances(prev =>
                    prev.map((m) => (m._id === _id ? updatedMaintenance : m))
                );

                toast.success("Maintenance mise à jour avec succès !");
            } else {
                const newMaintenance = await addMaintenance({
                    date,
                    date_realisée: date_realisée || null,
                    type,
                    description: formData.description || "",
                    cout: parseFloat(cout),
                    vehicule
                });

                setMaintenances(prev => [...prev, newMaintenance]);
                toast.success("Maintenance ajoutée avec succès !");
            }

            setFormData({
                _id: "",
                date: "",
                date_realisée: "",
                type: "",
                cout: "",
                vehicule: "",
                description: ""
            });

            setIsFormVisible(false);
        } catch (error) {
            console.error("Erreur lors de l'ajout ou de la mise à jour de la maintenance", error);
            toast.error("Échec de l'ajout ou de la mise à jour de la maintenance");
        }
    };

    const handleEdit = (maintenance) => {
        if (maintenance.date_realisée) {
            toast.error("Impossible de modifier une maintenance terminée");
            return;
        }
        
        setFormData({
            _id: maintenance._id,
            date: maintenance.date,
            date_realisée: maintenance.date_realisée,
            type: maintenance.type,
            cout: maintenance.cout,
            vehicule: maintenance.vehicule ? maintenance.vehicule._id : "",
            description: maintenance.description || ""
        });
        setIsFormVisible(true);
    };

    const handleTerminerMaintenance = async (maintenanceId) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            console.log("Starting terminerMaintenance for ID:", maintenanceId);
            console.log("Request body:", { date_realisée: today, statut: "Terminée" });

            const response = await fetch(`http://localhost:5000/api/maintenance/terminer/${maintenanceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    date_realisée: today,
                    statut: "Terminée"
                }),
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", [...response.headers.entries()]);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API error response:", errorText);
                throw new Error(`Échec de la mise à jour de la maintenance: ${response.status} ${errorText}`);
            }

            let updatedMaintenance;
            try {
                updatedMaintenance = await response.json();
                console.log("Response JSON:", updatedMaintenance);
            } catch (error) {
                console.warn("Failed to parse JSON response, possibly 204 No Content:", error.message);
                updatedMaintenance = null;
            }

            console.log("Updating state for maintenance ID:", maintenanceId);
            setMaintenances(prev =>
                prev.map((m) =>
                    m._id === maintenanceId ? { 
                        ...m, 
                        date_realisée: today, 
                        statut: "Terminée" 
                    } : m
                )
            );

            toast.success("Maintenance terminée avec succès !");
            window.dispatchEvent(new Event('eventsUpdated'));
        } catch (error) {
            console.error("Error in handleTerminerMaintenance:", error.message);
            console.error("Full error details:", error);
            toast.error("Échec de la mise à jour de la maintenance");
        }
    };

    const handleDelete = async (maintenanceId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette maintenance ?")) {
            return;
        }

        try {
            await deleteMaintenance(maintenanceId);
            setMaintenances(prev => prev.filter(m => m._id !== maintenanceId));
            toast.success("Maintenance supprimée avec succès !");
            window.dispatchEvent(new Event('eventsUpdated'));
        } catch (error) {
            console.error("Erreur lors de la suppression de la maintenance", error);
            toast.error("Échec de la suppression de la maintenance");
        }
    };

    const filteredMaintenances = maintenances
        .filter(m => {
            const search = searchTerm.toLowerCase();
            const vehicleInfo = m.vehicule ?
                `${m.vehicule.marque} ${m.vehicule.modele} ${m.vehicule.immatriculation}`.toLowerCase() : "";
            const maintenanceType = m.type ? m.type.toLowerCase() : "";

            return (maintenanceType.includes(search) || vehicleInfo.includes(search));
        })
        .sort((a, b) => {
            const statusA = (a.vehicule?.statut || "").trim().toLowerCase();
            const statusB = (b.vehicule?.statut || "").trim().toLowerCase();
            if (statusA === "disponible" && statusB !== "disponible") return 1;
            if (statusA !== "disponible" && statusB === "disponible") return -1;
            return 0;
        });

    return (
        <div className="maintenance-container">
            <ToastContainer position="bottom-right" />

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
                    <h2 className="subtitle">{formData._id ? "Modifier la Maintenance" : "Ajouter une Maintenance"}</h2>
                    <form onSubmit={handleSubmit} className="maintenance-form">
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
                                        {veh.marque} {veh.modele} ({veh.immatriculation}) - {veh.statut}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Date prévue *</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Date réalisée</label>
                            <input
                                type="date"
                                name="date_realisée"
                                value={formData.date_realisée}
                                onChange={handleChange}
                            />
                        </div>

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

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                            />
                        </div>

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

                        <div className="form-actions">
                            <button type="submit" className="submit-button">
                                {formData._id ? "Mettre à jour" : "Enregistrer"}
                            </button>
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
                                <th>Statut Véhicule</th>
                                <th>Actions</th>
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
                                    <td>
                                        {m.vehicule ? 
                                            `${m.vehicule.marque} ${m.vehicule.modele} (${m.vehicule.immatriculation})` 
                                            : "Inconnu"}
                                    </td>
                                    <td>{m.vehicule?.statut || "-"}</td>
                                    <td>
                                        {!m.date_realisée && (
                                            <>
                                                {m.vehicule?.statut !== "Disponible" && (
                                                    <>
                                                        <button
                                                            className="edit-button"
                                                            onClick={() => handleEdit(m)}
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            className="terminate-button"
                                                            onClick={() => handleTerminerMaintenance(m._id)}
                                                        >
                                                            Terminer
                                                        </button>
                                                    </>
                                                )}
                                                {m.vehicule?.statut === "Disponible" && (
                                                    <button
                                                        className="delete-button"
                                                        onClick={() => handleDelete(m._id)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                            </>
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