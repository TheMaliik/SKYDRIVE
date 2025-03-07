import React from 'react';
import './styles/App.css';
import StatCard from './components/StatCard';
import Sidebar from './components/Sidebar';
import AdminMenu from './components/AdminMenu';

function App() {
  return (
    <div className="dashboard">
      <Sidebar />
      
      <div className="main-content">
        <header className="header">
          <h1>Tableau de bord</h1>
          <div className="admin-menu-container">
            <AdminMenu />
          </div>
        </header>

        <div className="content-wrapper">
          <div className="stat-cards">
            <StatCard title="Total des véhicules" value="150" icon="🚗" />
            <StatCard title="Entretiens à prévoir" value="30" icon="🔧" />
            <StatCard title="Employés actifs" value="20" icon="👥" />
            <StatCard title="Contrats" value="12" icon="📄" />
            <StatCard title="Réservations" value="85%" icon="📅" />
          </div>

          {/* Ajout de la section Performance du parc */}
          <section className="performance">
            <h3>Performance du parc</h3>
            <div className="performance-status">
              {/* L'espace ici sera pour des informations dynamiques sur le parc */}
              <span>À venir : Données de performance du parc</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
