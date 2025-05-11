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
          show: true, // Enable zoom/pan controls
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          endingShape: 'rounded', // Rounded bar edges
          borderRadius: 5,
        },
      },
      dataLabels: {
        enabled: true, // Show price labels on bars
        formatter: (val) => `$${val}`,
        style: {
          fontSize: '12px',
          colors: ['#304758'],
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
          text: 'Brand',
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
          text: 'Average Price ($)',
          style: {
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'Arial, sans-serif',
          },
        },
        labels: {
          formatter: (val) => `$${val}`,
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
          formatter: (val) => `$${val}`,
        },
        theme: 'light',
      },
      title: {
        text: 'Average Price by Brand',
        align: 'center',
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
  const [error, setError] = useState(null);

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
        console.log('API Response:', data);

        // Validate data structure
        if (!Array.isArray(data) || data.length === 0) {
          setError('No data available for the chart.');
          setIsLoading(false);
          return;
        }

        // Map _id to brands and avgPrice to prices
        const brands = data.map(item => item._id || 'Unknown');
        const prices = data.map(item => item.avgPrice || 0);

        console.log('Processed brands:', brands);
        console.log('Processed prices:', prices);

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
        setError('Failed to load chart data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicules();
    fetchPriceByBrand();
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

      <h1 className="chart-title">Prix moyen par marque</h1>
      <div className="chart-container">
        {isLoading ? (
          <p className="chart-message">Loading chart...</p>
        ) : error ? (
          <p className="chart-message chart-error">{error}</p>
        ) : chartData.series[0].data.length === 0 ? (
          <p className="chart-message">No data to display in the chart.</p>
        ) : (
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={400} // Slightly taller for better visibility
          />
        )}
      </div>
    </>
  );
};

export default StatCards;