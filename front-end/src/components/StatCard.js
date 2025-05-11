import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chart from 'react-apexcharts';
import '../styles/StatCard.css';
import { API_VEHICULES } from '../api';

const StatCard = ({ title, value, icon, onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
    <span className="icon">{icon}</span>
    <div className="details">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const StatCards = ({ onNavigate }) => {
  const [totalVehicules, setTotalVehicules] = useState(0);
  const [chartData, setChartData] = useState({
    series: [{ name: 'Price', data: [] }],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: true,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          endingShape: 'rounded',
          borderRadius: 5,
        },
      },
      
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Marque',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
          },
        },
        labels: {
          style: {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Prix moyen (DT)',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
          },
        },
        labels: {
          formatter: (val) => `DT ${val}`,
          style: {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.25,
          gradientToColors: ['#4facfe'],
          inverseColors: false,
          opacityFrom: 0.85,
          opacityTo: 0.55,
          stops: [0, 100],
        },
      },
      colors: ['#00f2fe'],
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5,
        },
      },
      tooltip: {
        y: {
          formatter: (val) => `DT ${val}`,
        },
        theme: 'light',
      },
      title: {
        text: 'Prix moyen par marque',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'Arial, sans-serif',
          color: '#263238',
        },
      },
    },
  });

  const [locationsChartData, setLocationsChartData] = useState({
    series: [{ name: 'Locations', data: [] }],
    options: {
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Mois',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
          },
        },
        labels: {
          style: {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Nombre de locations',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
          },
        },
        labels: {
          formatter: (val) => Math.round(val),
          style: {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.3,
          stops: [0, 90, 100],
        },
      },
      colors: ['#00e396'],
      grid: {
        borderColor: '#e7e7e7',
      },
      tooltip: {
        x: {
          formatter: (val, { dataPointIndex }) => {
            const monthNames = [
              'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
              'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
            ];
            const dataPoint = locationsChartData.series[0].data[dataPointIndex];
            if (dataPoint && dataPoint.meta) {
              const { year, month } = dataPoint.meta;
              return `${monthNames[month - 1]} ${year}`;
            }
            return val; // Fallback si meta est absent
          },
        },
        y: {
          formatter: (val) => `${val} locations`,
        },
        theme: 'light',
      },
      title: {
        text: 'Locations par mois',
        align: 'left',
        style: {
          fontSize: '16px',
          fontWeight: 600,
          fontFamily: 'Arial, sans-serif',
          color: '#263238',
        },
      },
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationsError, setLocationsError] = useState(null);

  useEffect(() => {
    // Fetch vehicles count
    const fetchVehicules = async () => {
      try {
        const { data } = await axios.get(API_VEHICULES);
        setTotalVehicules(data.length);
      } catch (err) {
        console.error('Erreur de chargement des véhicules :', err);
      }
    };

    // Fetch price by brand data
    const fetchPriceByBrand = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/stats/price-by-brand');
        if (!Array.isArray(data) || data.length === 0) {
          setError('Aucune donnée disponible pour le graphique.');
          return;
        }

        const brands = data.map(item => item._id || 'Inconnu');
        const prices = data.map(item => item.avgPrice || 0);

        setChartData(prev => ({
          ...prev,
          series: [{ name: 'Price', data: prices }],
          options: {
            ...prev.options,
            xaxis: {
              ...prev.options.xaxis,
              categories: brands,
            },
          },
        }));
      } catch (err) {
        console.error('Erreur de chargement des stats de prix par marque :', err);
        setError('Échec du chargement des données du graphique.');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch locations per month data
    const fetchLocationsPerMonth = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/stats/locations-per-month');
        console.log('Données API locations-per-month :', data); // Débogage

        if (!Array.isArray(data) || data.length === 0) {
          setLocationsError('Aucune donnée disponible pour le graphique des locations.');
          return;
        }

        // Valider et formater les données
        const categories = data.map(item => {
          if (!item.year || !item.month) {
            console.warn('Donnée invalide détectée :', item);
            return 'Inconnu';
          }
          return `${item.month}/${item.year}`;
        });
        const counts = data.map(item => {
          if (!item.year || !item.month || !item.count) {
            console.warn('Donnée incomplète :', item);
            return { x: 'Inconnu', y: 0, meta: { year: 'N/A', month: 'N/A' } };
          }
          return {
            x: `${item.month}/${item.year}`,
            y: item.count,
            meta: { year: item.year, month: item.month },
          };
        });

        console.log('Données formatées pour le graphique :', counts); // Débogage

        setLocationsChartData(prev => ({
          ...prev,
          series: [{ name: 'Locations', data: counts }],
          options: {
            ...prev.options,
            xaxis: {
              ...prev.options.xaxis,
              categories,
            },
          },
        }));
      } catch (err) {
        console.error('Erreur de chargement des stats de locations par mois :', err);
        setLocationsError('Échec du chargement des données du graphique des locations.');
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchVehicules();
    fetchPriceByBrand();
    fetchLocationsPerMonth();
  }, []);

  const data = [
    { title: 'Total des véhicules', value: totalVehicules, icon: '🚗' },
    { title: 'Entretiens à prévoir', value: 10, icon: '🔧' },
    {
      title: 'Employés actifs',
      value: 8,
      icon: '👥',
      onClick: () => onNavigate('GestionEmployes'),
    },
    {
      title: 'Contrats',
      value: 15,
      icon: '📄',
      onClick: () => onNavigate('Contracts'),
    },
    {
      title: 'Suivi Financier',
      value: 20,
      icon: '📅',
      onClick: () => onNavigate('Financial'),
    },
  ];

  return (
    <>
      <div className="stats-container">
        {data.map((item, index) => (
          <StatCard
            key={index}
            title={item.title}
            value={item.value}
            icon={item.icon}
            onClick={item.onClick}
          />
        ))}
      </div>

      <div className="charts-container">
        <div className="chart-container">
          {isLoading ? (
            <p className="chart-message">Chargement du graphique...</p>
          ) : error ? (
            <p className="chart-message chart-error">{error}</p>
          ) : chartData.series[0].data.length === 0 ? (
            <p className="chart-message">Aucune donnée à afficher dans le graphique.</p>
          ) : (
            <Chart
              options={chartData.options}
              series={chartData.series}
              type="bar"
              height={500}
            />
          )}
        </div>

        <div className="chart-container">
          {locationsLoading ? (
            <p className="chart-message">Chargement du graphique...</p>
          ) : locationsError ? (
            <p className="chart-message chart-error">{locationsError}</p>
          ) : locationsChartData.series[0].data.length === 0 ? (
            <p className="chart-message">Aucune donnée à afficher dans le graphique.</p>
          ) : (
            <Chart
              options={locationsChartData.options}
              series={locationsChartData.series}
              type="area"
              height={500}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default StatCards;