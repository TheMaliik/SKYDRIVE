// Notifications.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Notifications.css'; // Assurez-vous d'avoir ce fichier CSS pour le style
import { API_NOTIFICATIONS } from "../api"; 

const Notifications = () => {
  // États pour les notifications et le nombre de notifications non lues
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get(API_NOTIFICATIONS);
      setNotifications(res.data);

      // Calculer le nombre de notifications non lues
      const unreadNotifications = res.data.filter(notif => !notif.seen);
      setUnreadCount(unreadNotifications.length); // Mettre à jour le nombre de notifications non lues
    } catch (error) {
      console.error('Erreur:', error.response?.data || error.message);
    }
  };

  // Appeler fetchNotifications lors du montage du composant
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (id) => {
    try {
      await axios.put(`${API_NOTIFICATIONS}/${id}`, { seen: true });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error.response?.data || error.message);
    }
  };

  // Fonction pour supprimer une notification
  const deleteNotification = async (id) => {
    if (window.confirm('Supprimer cette notification ?')) {
      try {
        await axios.delete(`${API_NOTIFICATIONS}/${id}`);
        fetchNotifications();
      } catch (error) {
        console.error('Erreur:', error.response?.data || error.message);
      }
    }
  };

  return (
    <div className="notifications-container">
      <h1>🔔 Notifications</h1>
      <p>Notifications non lues: {unreadCount}</p> {/* Afficher le nombre de notifications non lues */}
      
      <ul>
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <li key={notif._id} className={notif.seen ? 'read' : ''}>
              <div className="notif-content">
                <span>{notif.message}</span>
                <small>{new Date(notif.createdAt).toLocaleString()}</small>
              </div>
              <div className="notif-actions">
                {!notif.seen && (
                  <button onClick={() => markAsRead(notif._id)}>Marquer comme lu</button>
                )}
                <button onClick={() => deleteNotification(notif._id)}>Supprimer</button>
              </div>
            </li>
          ))
        ) : (
          <li>Aucune notification</li>
        )}
      </ul>
    </div>
  );
};

export default Notifications;
