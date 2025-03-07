// Dashboard.js
import React from "react";
import Sidebar from "./Sidebar";
import StatCard from "./StatCard";
import "./Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-header">
          <h2>Tableau de bord</h2>
          <span className="admin-profile">👤 Administrateur</span>
        </div>
        <div className="stats-container">
          <StatCard icon="🚗" title="Total des véhicules" value="150" />
          <StatCard icon="🔧" title="Entretiens à prévoir" value="30" />
          <StatCard icon="👥" title="Employés actifs" value="20" />
          <StatCard icon="📄" title="Contrats" value="12" />
          <StatCard icon="📅" title="Réservations" value="85%" />
        </div>
        <div className="notifications">
          <h3>Notifications</h3>
          <p>Réservations en cours</p>
          <p>Contrats en attente</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
