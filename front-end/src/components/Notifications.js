import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Notifications.css';
import { API_NOTIFICATIONS } from "../api"; 

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userRole = localStorage.getItem('role'); // Retrieve user role from localStorage
  console.log('User role from localStorage:', userRole);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications from:', API_NOTIFICATIONS);
      const res = await axios.get(API_NOTIFICATIONS);
      console.log('Notifications fetched:', res.data);
      setNotifications(res.data);

      const unreadNotifications = res.data.filter(notif => !notif.seen);
      console.log('Unread notifications count:', unreadNotifications.length);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error.response?.data || error.message);
    }
  };

  const fetchDailyProfit = async () => {
    try {
      console.log('Fetching daily profit from: http://localhost:5000/api/Profit/daily-profit');
      const res = await axios.get('http://localhost:5000/api/Profit/daily-profit');
      console.log('Daily profit response:', res.data);
    } catch (error) {
      console.error('Erreur lors de la récupération du profit quotidien:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    console.log('Component mounted, fetching notifications and daily profit');
    fetchNotifications();
    fetchDailyProfit();
  }, []);

  const markAsRead = async (id) => {
    try {
      console.log('Marking notification as read, ID:', id);
      await axios.put(`${API_NOTIFICATIONS}/${id}`, { seen: true });
      console.log('Notification marked as read, ID:', id);
      fetchNotifications();
    } catch (error) {
      console.error('Erreur lors du marquage comme lu, ID:', id, error.response?.data || error.message);
    }
  };

  const deleteNotification = async (id) => {
    if (window.confirm('Supprimer cette notification ?')) {
      try {
        console.log('Deleting notification, ID:', id);
        await axios.delete(`${API_NOTIFICATIONS}/${id}`);
        console.log('Notification deleted, ID:', id);
        fetchNotifications();
      } catch (error) {
        console.error('Erreur lors de la suppression de la notification, ID:', id, error.response?.data || error.message);
      }
    } else {
      console.log('Deletion canceled for notification, ID:', id);
    }
  };

  // Filter notifications: show FINANCE notifications only to admin users
  const filteredNotifications = notifications.filter(notif => {
    if (notif.TypeNotif === 'FINANCE' && userRole !== 'admin') {
      return false; // Exclude FINANCE notifications for non-admin users
    }
    return true; // Include all other notifications
  });

  // Trier les notifications: non lues en premier, puis les lues
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    if (a.seen === b.seen) return 0;
    return a.seen ? 1 : -1;
  });
  console.log('Filtered and sorted notifications:', sortedNotifications);

  return (
    <div className="notifications-container">
      <h1>🔔 Notifications</h1>
      <p>Notifications non lues: {unreadCount}</p>
      
      <ul>
        {sortedNotifications.length > 0 ? (
          sortedNotifications.map((notif) => (
<li key={notif._id} className={`${notif.seen ? 'read' : 'unread'} ${notif.isAlert ? 'alert-notif' : ''}`}>
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