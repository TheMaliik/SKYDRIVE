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

// ========================= VÉHICULES =========================

export const fetchVehicules = async () => {
    try {
        const response = await axios.get(API_VEHICULES);
        return response.data;
    } catch (error) {
        console.error("Erreur lors du chargement des véhicules", error);
        throw error;
    }
};

// Mettre à jour la date de maintenance (si ce point d’API existe bien côté backend)
export const updateVehiculeMaintenanceDate = async (vehiculeId, date) => {
    try {
        const response = await axios.put(`${API_VEHICULES}/${vehiculeId}/update-maintenance-date`, {
            date_maintenance: date,
        });
        return response.data;
    } catch (error) {
        console.error("Échec mise à jour date maintenance", error);
        throw error;
    }
};

// ========================= MAINTENANCES =========================

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

export const updateMaintenance = async (id, updatedData) => {
    try {
        const response = await axios.put(`${API_MAINTENANCES}/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la maintenance", error);
        throw error;
    }
};

export const terminerMaintenance = async (maintenanceId, date_realisée) => {
    try {
        const response = await axios.put(`${API_MAINTENANCES}/terminer/${maintenanceId}`, {
            date_realisée
        });
        return response.data;
    } catch (error) {
        console.error("Échec de la mise à jour de la maintenance", error);
        throw error;
    }
};







// In ../api.js
export const deleteMaintenance = async (maintenanceId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/maintenance/deletemaintenance/${maintenanceId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Échec de la suppression de la maintenance");
        }

        return response.json();
    } catch (error) {
        throw new Error(error.message);
    }
};




// ========================= AUTRES MODULES (si besoin) =========================
// Tu peux faire de même pour les autres modules (Locations, Clients, Users, etc.)
