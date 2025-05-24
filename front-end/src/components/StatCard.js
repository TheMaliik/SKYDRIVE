import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import '../styles/StatCard.css';

const StatCard = ({ title, value, icon, onClick, loading = false }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <span className="icon">{icon}</span>
    <div className="details">
      <h4>{title}</h4>
      <p>{loading ? '...' : value}</p>
    </div>
  </div>
);

const StatCards = ({ onNavigate }) => {
  const [role, setRole] = useState(null);
  const [stats, setStats] = useState({
    vehicles: {
      total: 0,
      available: 0,
      maintenance: 0,
      loading: true,
      error: null
    },
    locations: {
      active: 0,
      loading: true,
      error: null
    }
  });

  const [locationsChartData, setLocationsChartData] = useState({
    series: [{ name: 'Locations', data: [] }],
    options: {
      chart: { type: 'area', height: 350, toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      xaxis: { categories: [] },
      /* ... (keep your existing chart options) ... */
    }
  });

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);

    const fetchData = async () => {
      // 1. Fetch vehicles data
      try {
        const { data } = await axios.get('http://localhost:5000/api/stats/vehicles/availability');
        if (!data.success) throw new Error('Invalid vehicle data');
        
        const vehicles = data.data || [];
        setStats(prev => ({
          ...prev,
          vehicles: {
            total: vehicles.length,
            available: vehicles.filter(v => v.isAvailable).length,
            maintenance: vehicles.filter(v => v.statut === 'En maintenance').length,
            loading: false,
            error: null
          }
        }));
      } catch (err) {
        setStats(prev => ({
          ...prev,
          vehicles: { ...prev.vehicles, loading: false, error: 'Erreur de chargement' }
        }));
        console.error('Vehicle load error:', err);
      }

      // 2. Fetch active locations (optimized)
      try {
        const { data } = await axios.get('http://localhost:5000/api/locations/stats/en-cours');
        setStats(prev => ({
          ...prev,
          locations: {
            active: data.nombreLocationsEnCours || 0,
            loading: false,
            error: null
          }
        }));
      } catch (err) {
        console.error('Active locations API error:', err);
        // Fallback: fetch all locations
        try {
          const { data } = await axios.get('http://localhost:5000/api/locations/');
          const activeLocations = Array.isArray(data) 
            ? data.filter(loc => loc.statut === 'active').length 
            : 0;
          
          setStats(prev => ({
            ...prev,
            locations: {
              active: activeLocations,
              loading: false,
              error: null
            }
          }));
        } catch (fallbackErr) {
          setStats(prev => ({
            ...prev,
            locations: { ...prev.locations, loading: false, error: 'Erreur de chargement' }
          }));
          console.error('Fallback error:', fallbackErr);
        }
      }

      // 3. Fetch chart data
      try {
        const { data } = await axios.get('http://localhost:5000/api/stats/locations-per-month');
        if (Array.isArray(data)) {
          const categories = data.map(item => `${item.month}/${item.year}`);
          const counts = data.map(item => ({
            x: `${item.month}/${item.year}`,
            y: item.count,
            meta: { year: item.year, month: item.month },
          }));

          setLocationsChartData(prev => ({
            ...prev,
            series: [{ name: 'Locations', data: counts }],
            options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories } },
          }));
        }
      } catch (err) {
        console.error('Chart data error:', err);
      }
    };

    fetchData();
  }, []);

  const statCardsData = [
    { 
      title: 'Total des véhicules', 
      value: stats.vehicles.total, 
      icon: '🚘',
      loading: stats.vehicles.loading
    },
    { 
      title: 'Véhicules disponibles', 
      value: stats.vehicles.available, 
      icon: '✔️',
      loading: stats.vehicles.loading
    },
    { 
      title: 'Véhicules en maintenance', 
      value: stats.vehicles.maintenance, 
      icon: '🔧',
      loading: stats.vehicles.loading
    },
    { 
      title: 'Locations en cours', 
      value: stats.locations.active, 
      icon: '📍',
      loading: stats.locations.loading
    },
    { 
      title: 'Contrats', 
      icon: '📄', 
      onClick: () => onNavigate('Contracts') 
    }
  ];

  if (role === 'admin') {
    statCardsData.push(
      { title: 'Employés', icon: '👥', onClick: () => onNavigate('GestionEmployes') },
      { title: 'Suivi Financier', icon: '📅', onClick: () => onNavigate('Financial') }
    );
  }

  return (
    <>
      <div className="stats-container">
        {statCardsData.map((item, index) => (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            onClick={item.onClick}
            loading={item.loading}
          />
        ))}
      </div>

      <div className="charts-container">
        {locationsChartData.series[0].data.length === 0 ? (
          <p>Chargement des données du graphique...</p>
        ) : (
          <Chart 
            options={locationsChartData.options} 
            series={locationsChartData.series} 
            type="area" 
            height={350} 
          />
        )}
      </div>
    </>
  );
};

export default StatCards;