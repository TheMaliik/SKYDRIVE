import React from 'react';
import { FaUser, FaCog, FaMoon, FaSignOutAlt } from 'react-icons/fa';
import '../styles/AdminMenu.css';

function AdminMenu() {
  return (
    <div className="admin-menu">
      <div className="profile">
        <FaUser size={20} />
      </div>
      <ul className="menu-options">
        <li className="menu-header">
          <span><FaUser /> Profil</span> <span>Admin</span>
        </li>
        <li><FaCog /> Paramètres</li>
        <li><FaMoon /> Mode sombre</li>
        <li><FaSignOutAlt /> Se déconnecter</li>
      </ul>
    </div>
  );
}

export default AdminMenu;
