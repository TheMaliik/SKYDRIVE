import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/GestionClient.css';
import { API_CLIENTS } from "../api";

const GestionClient = () => {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showBlacklistConfirm, setShowBlacklistConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const { data } = await axios.get(API_CLIENTS);
                setClients(data);
            } catch (error) {
                console.error("Erreur lors du chargement des clients", error);
            }
        };
        fetchClients();
    }, []);

    const handleEdit = (client) => {
        if (client.locationEnCours) {
            alert("Impossible de modifier ce client car il a une location en cours.");
            return;
        }
        setSelectedClient(client);
        setShowModal(true);
    };

    const handleDeleteClick = (client) => {
        if (client.locationEnCours) {
            alert("Impossible de supprimer ce client car il a une location en cours.");
            return;
        }
        setSelectedClient(client);
        setShowConfirmModal(true);
    };

    const handleBlacklistClick = (client) => {
        if (client.locationEnCours) {
            alert("Impossible de modifier la liste noire pour un client ayant une location en cours.");
            return;
        }
        setSelectedClient(client);
        setShowBlacklistConfirm(true);
    };

    const handleSaveEdit = async () => {
        if (selectedClient.CIN && !/^\d{8}$/.test(selectedClient.CIN)) {
            alert("Le CIN doit contenir exactement 8 chiffres");
            return;
        }

        if (selectedClient.telephone && !/^\d{8}$/.test(selectedClient.telephone)) {
            alert("Le téléphone doit contenir exactement 8 chiffres");
            return;
        }

        try {
            await axios.put(`${API_CLIENTS}/${selectedClient._id}`, selectedClient);
            setClients(clients.map(c => c._id === selectedClient._id ? selectedClient : c));
            setShowModal(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Erreur lors de la modification du client", error);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_CLIENTS}/${selectedClient._id}`);
            setClients(clients.filter(client => client._id !== selectedClient._id));
            setShowConfirmModal(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Erreur lors de la suppression du client", error);
        }
    };

    const toggleBlacklist = async () => {
        try {
            const updatedClient = {
                ...selectedClient,
                blacklisted: !selectedClient.blacklisted,
            };
            await axios.put(`${API_CLIENTS}/${selectedClient._id}`, updatedClient);
            setClients(clients.map(c => c._id === updatedClient._id ? updatedClient : c));
            setShowBlacklistConfirm(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la liste noire", error);
        }
    };

    const filteredClients = clients.filter((client) => {
        const term = searchTerm.toLowerCase();
        return (
            client.nom?.toLowerCase().includes(term) ||
            client.prenom?.toLowerCase().includes(term) ||
            client.CIN?.toLowerCase().includes(term) ||
            client.telephone?.toLowerCase().includes(term)
        );
    });

    return (
        <div id="gestion-client-container">
            <h2 id="gestion-client-subtitle">Liste des clients</h2>

            <div id="client-search-bar">
                <input
                    type="text"
                    placeholder="Rechercher par nom, prénom, CIN ou téléphone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table id="clients-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>CIN</th>
                        <th>Téléphone</th>
                        <th>Ville</th>
                        <th>Nombre de locations</th>
                        <th>Fidélité</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredClients.map((client) => (
                        <tr key={client._id} className={client.blacklisted ? "blacklisted-row" : ""}>
                            <td>{client.nom}</td>
                            <td>{client.prenom}</td>
                            <td>{client.CIN}</td>
                            <td>{client.telephone}</td>
                            <td>{client.ville}</td>
                            <td className="center">{client.nombreLocations}</td>
                            <td>
                                <span className={`fidelity-status ${client.fidelityStatus 
                                    ? client.fidelityStatus.toLowerCase().replace(/\s+/g, '-') 
                                    : 'non-fidelise'}`}>
                                    {client.fidelityStatus || 'Non fidélisé'}
                                </span>
                            </td>
                            <td>
                                <button 
                                    id="btn-edit" 
                                    onClick={() => handleEdit(client)} 
                                    disabled={client.locationEnCours}
                                >
                                    Modifier
                                </button>
                                <button 
                                    id="btn-delete" 
                                    onClick={() => handleDeleteClick(client)} 
                                    disabled={client.locationEnCours}
                                >
                                    Supprimer
                                </button>
                                <button
                                    id="btn-blacklist"
                                    onClick={() => handleBlacklistClick(client)}
                                    disabled={client.locationEnCours}
                                >
                                    {client.blacklisted ? "Retirer liste noire" : "Ajouter liste noire"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal d'édition (sans le bouton de liste noire) */}
            {showModal && selectedClient && (
                <div id="modal-edit">
                    <div className="modal-content">
                        <h3>Modification du client</h3>
                        <form>
                            {['nom', 'prenom', 'ville'].map((field) => (
                                <div className="form-group" key={field}>
                                    <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                    <input
                                        type="text"
                                        id={field}
                                        value={selectedClient[field]}
                                        onChange={(e) => setSelectedClient({ ...selectedClient, [field]: e.target.value })}
                                        disabled={selectedClient.locationEnCours}
                                    />
                                </div>
                            ))}
                            <div className="form-group">
                                <label htmlFor="CIN">CIN</label>
                                <input
                                    type="text"
                                    id="CIN"
                                    value={selectedClient.CIN || ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setSelectedClient({ ...selectedClient, CIN: value });
                                    }}
                                    maxLength="8"
                                    pattern="\d{8}"
                                    title="Le CIN doit contenir exactement 8 chiffres"
                                    disabled={selectedClient.locationEnCours}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="telephone">Téléphone</label>
                                <input
                                    type="text"
                                    id="telephone"
                                    value={selectedClient.telephone || ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setSelectedClient({ ...selectedClient, telephone: value });
                                    }}
                                    maxLength="8"
                                    pattern="\d{8}"
                                    title="Le téléphone doit contenir exactement 8 chiffres"
                                    disabled={selectedClient.locationEnCours}
                                />
                            </div>
                        </form>
                        <div className="modal-buttons">
                            <button id="btn-edit" onClick={handleSaveEdit}>
                                Enregistrer
                            </button>
                            <button id="btn-close" onClick={() => setShowModal(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmModal && selectedClient && (
                <div id="modal-confirm-delete">
                    <div className="modal-content">
                        <h3>Suppression du client</h3>
                        <p>Confirmez-vous la suppression de <strong>{selectedClient.nom} {selectedClient.prenom}</strong> ?</p>
                        <div className="modal-buttons">
                            <button id="btn-blacklist" onClick={confirmDelete}>Oui, supprimer</button>
                            <button id="btn-close" onClick={() => setShowConfirmModal(false)}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {showBlacklistConfirm && selectedClient && (
                <div id="modal-blacklist">
                    <div className="modal-content">
                        <h3>{selectedClient.blacklisted ? "Retirer de la liste noire" : "Ajouter à la liste noire"}</h3>
                        <p>
                            {selectedClient.blacklisted
                                ? "Êtes-vous sûr(e) de vouloir retirer ce client de la liste noire ?"
                                : "Êtes-vous sûr(e) de vouloir ajouter ce client à la liste noire ?"}
                        </p>
                        <div className="modal-buttons">
                            <button id="btn-blacklist" onClick={toggleBlacklist}>Oui, confirmer</button>
                            <button id="btn-close" onClick={() => setShowBlacklistConfirm(false)}>Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionClient;