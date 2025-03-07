import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2 className="logo">🚗 SkyDrive</h2>
      <ul>
        <li><NavLink to="/dashboard">📊 Tableau de bord</NavLink></li>
        <li><NavLink to="/vehicules">🚗 Véhicules</NavLink></li>
        <li><NavLink to="/contrats">📄 Contrats</NavLink></li>
        <li><NavLink to="/reservations">📅 Réservations</NavLink></li>
        <li><NavLink to="/notifications">🔔 Notifications</NavLink></li>
        <li><NavLink to="/statistiques">📈 Statistiques</NavLink></li>
        <li><NavLink to="/utilisateurs">👥 Utilisateurs</NavLink></li>
      </ul>
    </div>
  );
};

export default Sidebar;
