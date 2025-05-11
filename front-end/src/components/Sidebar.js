import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ onPageChange, currentPage, unreadCount, role }) => {
  const navItems = [
    { name: "Dashboard", label: "📊 Tableau de bord" },
    { name: "GestionVehicules", label: "🚗 Véhicules" },
    { name: "GestionLocation", label: "📄 Location" },
    { name: "GestionClient", label: "👥 Clients" },
    { name: "Calendar", label: "📅 Calendrier" },
    { name: "GestionMaintenance", label: "🔧 Maintenance" },
    { name: "Notifications", label: `🔔 Notifications ${unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : ''}` },
     { name: "Statistiques", label: "📈 Statistiques" },
    ...(role === "admin" ? [{ name: "Statistiques", label: "📈 Statistiques" }] : []),
  ];

  return (
    <div className="sidebar">
      <h2 className="logo">🚗 SkyDrive</h2>
      <ul>
        {navItems.map(item => (
          <li key={item.name}>
            <div
              className={`sidebar-item ${currentPage === item.name ? 'active' : ''}`}
              onClick={() => onPageChange(item.name)}
            >
              {item.label}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
