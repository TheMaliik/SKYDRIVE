import axios from 'axios';

// Définition des constantes API
export const API_AUTH = "http://localhost:5000/api/auth";
export const API_VEHICULES = "http://localhost:5000/api/vehicules";
export const API_LOCATIONS = "http://localhost:5000/api/locations";
export const API_CLIENTS = "http://localhost:5000/api/client";
export const API_EVENTS = "http://localhost:5000/api/events";
export const API_MAINTENANCES = "http://localhost:5000/api/maintenance"; 
export const API_NOTIFICATIONS = "http://localhost:5000/api/notifications";
export const API_USERS = "http://localhost:5000/api/users";


export const fetchVehicules = async () => {
    try {
        const response = await axios.get(API_VEHICULES);
        return response.data;
    } catch (error) {
        console.error("Erreur lors du chargement des véhicules", error);
        throw error;
    }
};
export const fetchMaintenances = async () => {
    try {
        const response = await axios.get(API_MAINTENANCES); 
        return response.data;
    } catch (error) {
        console.error("Erreur lors du chargement des maintenances", error);
        throw error;
    }
};


export const addMaintenance = async (maintenanceData) => {
    try {
        const response = await axios.post(API_MAINTENANCES, maintenanceData); 
        return response.data;
    } catch (error) {
        console.error("Erreur lors de l'ajout de la maintenance", error);
        throw error;
    }
};
export const updateVehiculeMaintenanceDate = async (vehiculeId, date) => {
    const response = await fetch(`/vehicules/${vehiculeId}/update-maintenance-date`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date_maintenance: date }),
    });
    if (!response.ok) throw new Error("Échec mise à jour date maintenance");
    return response.json();
};

export const terminerMaintenance = async (maintenanceId) => {
    try {
        const response = await axios.put(`${API_MAINTENANCES}/terminer/${maintenanceId}`);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la terminaison de la maintenance", error);
        throw error;
    }
};
