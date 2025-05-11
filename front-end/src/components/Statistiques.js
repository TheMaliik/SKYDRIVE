import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import 'bootstrap/dist/css/bootstrap.min.css';

const StatistiquesVehicules = () => {
  const [statusChartData, setStatusChartData] = useState({ series: [], labels: [], total: 0 });
  const [fuelChartData, setFuelChartData] = useState({ series: [], labels: [], total: 0 });
  const [yearChartData, setYearChartData] = useState({ series: [], labels: [], total: 0 });
  const [kilometrageChartData, setKilometrageChartData] = useState({ series: [], labels: [] });
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatistiquesVehicules = async () => {
      try {
        setLoading(true);

        const statusResponse = await axios.get('http://localhost:5000/api/stats/vehicles/count-by-status');
        if (!statusResponse.data || typeof statusResponse.data.data !== 'object' || statusResponse.data.data === null) {
          throw new Error('Réponse de données de statut invalide');
        }
        const statusData = statusResponse.data.data;
        setStatusChartData({
          series: Object.values(statusData).filter(val => typeof val === 'number' && !isNaN(val)),
          labels: Object.keys(statusData).filter(key => typeof key === 'string'),
          total: typeof statusResponse.data.total === 'number' && !isNaN(statusResponse.data.total) ? statusResponse.data.total : 0,
        });

        const fuelResponse = await axios.get('http://localhost:5000/api/stats/vehicles/count-by-carburant');
        if (!fuelResponse.data || typeof fuelResponse.data.data !== 'object' || fuelResponse.data.data === null) {
          throw new Error('Réponse de données de carburant invalide');
        }
        const fuelData = fuelResponse.data.data;
        setFuelChartData({
          series: Object.values(fuelData).filter(val => typeof val === 'number' && !isNaN(val)),
          labels: Object.keys(fuelData).filter(key => typeof key === 'string'),
          total: typeof fuelResponse.data.total === 'number' && !isNaN(fuelResponse.data.total) ? fuelResponse.data.total : 0,
        });

        const yearResponse = await axios.get('http://localhost:5000/api/stats/vehicles/count-by-year');
        if (!yearResponse.data || typeof yearResponse.data.data !== 'object' || yearResponse.data.data === null) {
          throw new Error('Réponse de données d\'année invalide');
        }
        const yearData = yearResponse.data.data;
        const filteredYearData = Object.entries(yearData)
          .filter(([_, count]) => typeof count === 'number' && !isNaN(count) && count > 0)
          .reduce((acc, [year, count]) => {
            acc[year] = count;
            return acc;
          }, {});
        setYearChartData({
          series: Object.values(filteredYearData),
          labels: Object.keys(filteredYearData),
          total: typeof yearResponse.data.total === 'number' && !isNaN(yearResponse.data.total) ? yearResponse.data.total : 0,
        });

        const kilometrageResponse = await axios.get('http://localhost:5000/api/stats/kilometrage-by-fuel');
        if (!kilometrageResponse.data || !Array.isArray(kilometrageResponse.data)) {
          throw new Error('Réponse de données de kilométrage invalide');
        }
        setKilometrageChartData({
          series: kilometrageResponse.data.map(item => item.avgKilometrage),
          labels: kilometrageResponse.data.map(item => item._id),
        });

        const overallResponse = await axios.get('http://localhost:5000/api/stats/overall');
        if (!overallResponse.data || typeof overallResponse.data !== 'object') {
          throw new Error('Réponse de statistiques globales invalide');
        }
        setOverallStats(overallResponse.data);

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques des véhicules:', err.message, err.response?.data);
        setError(`Échec de la récupération des statistiques des véhicules: ${err.message}. Veuillez vérifier le serveur et réessayer.`);
        setLoading(false);
      }
    };

    fetchStatistiquesVehicules();
  }, []);

  const chartOptions = (title, labels, chartType = 'pie') => ({
    chart: {
      type: chartType,
      height: 350,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      background: '#ffffff',
    },
    colors: ['#1e88e5', '#26a69a', '#66bb6a', '#ef5350', '#ffca28', '#ab47bc'],
    title: {
      text: title,
      align: 'left',
      margin: 20,
      style: {
        fontSize: '18px',
        fontWeight: '600',
        fontFamily: '"Inter", sans-serif',
        color: '#263238',
      },
    },
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      labels: { colors: '#546e7a' },
      markers: { width: 12, height: 12, radius: 12 },
    },
    dataLabels: {
      enabled: true,
      formatter: chartType === 'pie' ? (val) => `${val.toFixed(1)}%` : (val) => Math.round(val).toLocaleString(),
      style: {
        fontSize: '12px',
        fontFamily: '"Inter", sans-serif',
        colors: chartType === 'pie' ? ['#ffffff'] : ['#263238'],
      },
      dropShadow: { enabledace: chartType === 'pie', top: 1, left: 1, blur: 1, opacity: 0.5 },
    },
    responsive: [{
      breakpoint: 576,
      options: {
        chart: { height: 280 },
        legend: { fontSize: '10px' },
        dataLabels: { style: { fontSize: '10px' } },
      },
    }],
    noData: {
      text: 'Aucune donnée disponible',
      align: 'center',
      verticalAlign: 'middle',
      style: { fontSize: '14px', fontFamily: '"Inter", sans-serif', color: '#78909c' },
    },
    ...(chartType === 'pie' ? { labels: labels.length > 0 ? labels : ['Aucune Donnée'] } : {}),
    ...(chartType === 'bar' ? {
      xaxis: {
        categories: labels.length > 0 ? labels : ['Aucune Donnée'],
        labels: { rotate: -45, style: { fontSize: '12px', fontFamily: '"Inter", sans-serif', colors: '#546e7a' } },
        axisTicks: { show: true, height: 6, color: '#eceff1' },
        axisBorder: { show: true, color: '#eceff1' },
      },
      yaxis: {
        title: { 
          text: chartType === 'bar' && title.includes('Kilométrage') ? 'Kilométrage Moyen (km)' : 'Nombre de Véhicules', 
          style: { fontSize: '12px', fontWeight: '600', fontFamily: '"Inter", sans-serif', color: '#263238' } 
        },
        labels: { 
          style: { fontSize: '12px', fontFamily: '"Inter", sans-serif', colors: '#546e7a' },
          formatter: (val) => Math.round(val).toLocaleString()
        },
      },
      plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 } },
      grid: { borderColor: '#eceff1', strokeDashArray: 4 },
      tooltip: {
        y: {
          formatter: (val) => `${Math.round(val).toLocaleString()} km`
        }
      }
    } : {}),
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f5f7fa;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #eceff1;
            border-top: 4px solid #1e88e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-container p {
            margin-top: 16px;
            font-size: 16px;
            color: #546e7a;
            font-family: 'Inter', sans-serif;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-alert">
          <h4>Erreur</h4>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
        <style jsx>{`
          .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f5f7fa;
            padding: 20px;
          }
          .error-alert {
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .error-alert h4 {
            color: #c62828;
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            font-family: 'Inter', sans-serif;
          }
          .error-alert p {
            color: #b71c1c;
            font-size: 16px;
            margin-bottom: 20px;
            font-family: 'Inter', sans-serif;
          }
          .error-alert button {
            background-color: #1e88e5;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
            font-family: 'Inter', sans-serif;
          }
          .error-alert button:hover {
            background-color: #1565c0;
          }
        `}</style>
      </div>
    );
  }

  const isStatusValid = statusChartData.series.length > 0 && statusChartData.labels.length > 0;
  const isFuelValid = fuelChartData.series.length > 0 && fuelChartData.labels.length > 0;
  const isYearValid = yearChartData.series.length > 0 && yearChartData.labels.length > 0;
  const isKilometrageValid = kilometrageChartData.series.length > 0 && kilometrageChartData.labels.length > 0;

  return (
    <div className="vehicle-stats-container">
      <div className="row">
        <div className="col-12">
          <div className="chart-card overall-stats">
            <div className="card-header">
              <h2>Statistiques Globales</h2>
            </div>
            <div className="card-body">
              {overallStats ? (
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Total des Locations</span>
                    <span className="stat-value">{overallStats.totalLocations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Locations Actives</span>
                    <span className="stat-value">{overallStats.activeLocations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Locations Terminées</span>
                    <span className="stat-value">{overallStats.completedLocations}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Revenu Total</span>
                    <span className="stat-value">DT {overallStats.totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Durée Moyenne de Location</span>
                    <span className="stat-value">{overallStats.averageRentalDurationDays.toFixed(1)} jours</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Distance Moyenne</span>
                    <span className="stat-value">{overallStats.averageDistanceKm} km</span>
                  </div>
                </div>
              ) : (
                <div className="no-data">Aucune statistique globale disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mt-4">
        <div className="col">
          <div className="chart-card">
            <div className="card-header">
              <h2>Répartition par Statut</h2>
              <span>Total: {statusChartData.total}</span>
            </div>
            <div className="card-body">
              {isStatusValid ? (
                <Chart
                  options={chartOptions('Répartition par Statut', statusChartData.labels, 'pie')}
                  series={statusChartData.series}
                  type="pie"
                  height={350}
                />
              ) : (
                <div className="no-data">Aucune donnée de statut disponible</div>
              )}
            </div>
          </div>
        </div>
        <div className="col">
          <div className="chart-card">
            <div className="card-header">
              <h2>Répartition par Type de Carburant</h2>
              <span>Total: {fuelChartData.total}</span>
            </div>
            <div className="card-body">
              {isFuelValid ? (
                <Chart
                  options={chartOptions('Répartition par Type de Carburant', fuelChartData.labels, 'pie')}
                  series={fuelChartData.series}
                  type="pie"
                  height={350}
                />
              ) : (
                <div className="no-data">Aucune donnée de type de carburant disponible</div>
              )}
            </div>
          </div>
        </div>
        <div className="col">
          <div className="chart-card">
            <div className="card-header">
              <h2>Répartition par Année</h2>
              <span>Total: {yearChartData.total}</span>
            </div>
            <div className="card-body">
              {isYearValid ? (
                <Chart
                  options={chartOptions('Répartition par Année', yearChartData.labels, 'bar')}
                  series={[{ name: 'Véhicules', data: yearChartData.series }]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className="no-data">Aucune donnée d\'année disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="chart-card">
            <div className="card-header">
              <h2>Kilométrage Moyen par Carburant</h2>
            </div>
            <div className="card-body">
              {isKilometrageValid ? (
                <Chart
                  options={chartOptions('Kilométrage Moyen par Carburant', kilometrageChartData.labels, 'bar')}
                  series={[{ name: 'Kilométrage Moyen', data: kilometrageChartData.series }]}
                  type="bar"
                  height={350}
                />
              ) : (
                <div className="no-data">Aucune donnée de kilométrage disponible</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .vehicle-stats-container {
          padding: 40px 20px;
          background-color: #f5f7fa;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }
        .chart-card {
          background: linear-gradient(145deg, #ffffff, #f8fafc);
          border-radius: 12px;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          overflow: hidden;
        }
        .chart-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
        }
        .overall-stats {
          background: linear-gradient(145deg, #e3f2fd, #bbdefb);
        }
        .card-header {
          background: transparent;
          padding: 16px 24px;
          border-bottom: 1px solid #eceff1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #263238;
          margin: 0;
        }
        .card-header span {
          font-size: 14px;
          font-weight: 500;
          color: #78909c;
        }
        .card-body {
          padding: 24px;
        }
        .no-data {
          font-size: 14px;
          color: #78909c;
          text-align: center;
          padding: 20px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 24px;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.5);
          transition: background 0.3s;
        }
        .stat-item:hover {
          background: rgba(255, 255, 255, 0.8);
        }
        .stat-label {
          font-size: 13px;
          font-weight: 500;
          color: #546e7a;
          margin-bottom: 8px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #263238;
        }
        @media (max-width: 768px) {
          .vehicle-stats-container {
            padding: 24px 12px;
          }
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
          }
          .stat-label {
            font-size: 12px;
          }
          .stat-value {
            font-size: 18px;
          }
          .card-header h2 {
            font-size: 14px;
          }
          .card-header span {
            font-size: 12px;
          }
        }
        @media (max-width: 576px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StatistiquesVehicules;