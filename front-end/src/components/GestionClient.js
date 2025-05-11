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
        setSelectedClient(client);
        setShowModal(true);
    };

    const handleDeleteClick = (client) => {
        setSelectedClient(client);
        setShowConfirmModal(true);
    };

    const handleBlacklistClick = () => {
        setShowBlacklistConfirm(true);
    };

    const handleSaveEdit = async () => {
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
        if (!selectedClient) return;
        try {
            const updatedClient = {
                ...selectedClient,
                blacklisted: !selectedClient.blacklisted,
            };
            await axios.put(`${API_CLIENTS}/${selectedClient._id}`, updatedClient);
            setClients(clients.map(c => c._id === updatedClient._id ? updatedClient : c));
            setShowModal(false);
            setShowBlacklistConfirm(false);
            setSelectedClient(null);
        } catch (error) {
            console.error("Erreur lors de la mise à jour de la blacklist", error);
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
        <div className="container">
            <h1 className="title">Gestion des Clients</h1>
            <h2 className="subtitle">Liste des Clients</h2>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Rechercher par nom, prénom, CIN ou téléphone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table className="clients-table">
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
                        <tr key={client._id}>
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
                                <button className="btn-edit" onClick={() => handleEdit(client)}>Modifier</button>
                                <button className="btn-delete" onClick={() => handleDeleteClick(client)}>Supprimer</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal d'édition */}
            {showModal && selectedClient && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Modifier le client</h3>
                        <label>Nom :
                            <input 
                                type="text" 
                                value={selectedClient.nom} 
                                onChange={(e) => setSelectedClient({ ...selectedClient, nom: e.target.value })} 
                            />
                        </label>
                        <label>Prénom :
                            <input 
                                type="text" 
                                value={selectedClient.prenom} 
                                onChange={(e) => setSelectedClient({ ...selectedClient, prenom: e.target.value })} 
                            />
                        </label>
                        <label>CIN :
                            <input 
                                type="text" 
                                value={selectedClient.CIN} 
                                onChange={(e) => setSelectedClient({ ...selectedClient, CIN: e.target.value })} 
                            />
                        </label>
                        <label>Téléphone :
                            <input 
                                type="text" 
                                value={selectedClient.telephone} 
                                onChange={(e) => setSelectedClient({ ...selectedClient, telephone: e.target.value })} 
                            />
                        </label>
                        <label>Ville :
                            <input 
                                type="text" 
                                value={selectedClient.ville} 
                                onChange={(e) => setSelectedClient({ ...selectedClient, ville: e.target.value })} 
                            />
                        </label>
                        <div className="modal-buttons">
                            <button onClick={handleBlacklistClick} className="btn-blacklist">
                                {selectedClient.blacklisted ? "Retirer de la liste noire" : "Ajouter à la liste noire"}
                            </button>
                            <button onClick={() => setShowModal(false)} className="btn-close">Fermer</button>
                            <button onClick={handleSaveEdit} className="btn-edit">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de suppression */}
            {showConfirmModal && selectedClient && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Confirmation</h3>
                        <p>Tu es sûre de vouloir supprimer ce client :</p>
                        <p><strong>{selectedClient.nom} {selectedClient.prenom}</strong> ?</p>
                        <div className="modal-buttons">
                            <button onClick={confirmDelete} className="btn-blacklist">Oui, supprimer</button>
                            <button onClick={() => setShowConfirmModal(false)} className="btn-close">Annuler</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmation de blacklist */}
            {showBlacklistConfirm && selectedClient && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Confirmation</h3>
                        <p>
                            {selectedClient.blacklisted
                                ? "Tu es sûre de vouloir retirer ce client de la liste noire ?"
                                : "Tu es sûre de vouloir ajouter ce client à la liste noire ?"}
                        </p>
                        <div className="modal-buttons">
                            <button onClick={toggleBlacklist} className="btn-blacklist">Oui, confirmer</button>
                            <button onClick={() => setShowBlacklistConfirm(false)} className="btn-close">Annuler</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionClient;
