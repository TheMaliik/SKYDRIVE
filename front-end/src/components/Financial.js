import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import '../styles/Financial.css';

const Financial = () => {
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [maintenanceCosts, setMaintenanceCosts] = useState([]);
  const [vehicleFinancials, setVehicleFinancials] = useState([]);

  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats/monthly-revenue');
        if (!response.ok) throw new Error('Failed to fetch monthly revenue data');
        const data = await response.json();
        setMonthlyRevenue(data);
      } catch (error) {
        console.error('Error fetching monthly revenue:', error);
      }
    };
    fetchMonthlyRevenue();
  }, []);

  useEffect(() => {
    const fetchMaintenanceCosts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats/maintenance/cout-par-mois');
        if (!response.ok) throw new Error('Failed to fetch maintenance cost data');
        const result = await response.json();
        if (result.success) setMaintenanceCosts(result.data);
        else throw new Error('API returned success: false');
      } catch (error) {
        console.error('Error fetching maintenance costs:', error);
      }
    };
    fetchMaintenanceCosts();
  }, []);

  useEffect(() => {
    const fetchVehicleFinancials = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/stats/vehicle-financials');
        if (!response.ok) throw new Error('Failed to fetch vehicle financials data');
        const data = await response.json();
        setVehicleFinancials(data);
      } catch (error) {
        console.error('Error fetching vehicle financials:', error);
      }
    };
    fetchVehicleFinancials();
  }, []);

  const revenueChartOptions = {
    chart: { type: 'area', height: 350, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: {
      type: 'category',
      categories: monthlyRevenue.map((item) => `${item.year}-${item.month.toString().padStart(2, '0')}`),
      title: { text: 'Mois' },
    },
    yaxis: {
      title: { text: 'Revenu Total (DT)' },
      labels: { formatter: (value) => `${value.toFixed(2)} DT` },
    },
    title: { text: 'Revenus Mensuels', align: 'center', style: { fontSize: '16px' } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    tooltip: { y: { formatter: (value) => `${value.toFixed(2)} DT` } },
  };

  const revenueChartSeries = [{ name: 'Revenu Total', data: monthlyRevenue.map((item) => item.totalRevenue) }];

  const maintenanceChartOptions = {
    chart: { type: 'area', height: 350, zoom: { enabled: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
    xaxis: {
      type: 'category',
      categories: maintenanceCosts.map((item) => item.periode),
      title: { text: 'Période' },
    },
    yaxis: {
      title: { text: 'Coût Total (DT)' },
      labels: { formatter: (value) => `${value.toFixed(2)} DT` },
    },
    title: { text: "Coûts d'Entretien Mensuels", align: 'center', style: { fontSize: '16px' } },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    tooltip: { y: { formatter: (value) => `${value.toFixed(2)} DT` } },
  };

  const maintenanceChartSeries = [{ name: 'Coût Total', data: maintenanceCosts.map((item) => item.totalCout) }];

  const vehicleFinancialsChartOptions = {
    chart: { type: 'bar', height: 350, stacked: false },
    plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: vehicleFinancials.map((item) => item.vehicleName),
      title: { text: 'Véhicule' },
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: 'Montant (DT)' },
      labels: { formatter: (value) => `${value.toFixed(2)} DT` },
    },
    title: { text: 'Résultats Financiers par Véhicule', align: 'center', style: { fontSize: '16px' } },
    tooltip: { y: { formatter: (value) => `${value.toFixed(2)} DT` } },
    legend: { position: 'top' },
  };

  const vehicleFinancialsChartSeries = [
    { name: 'Revenu Total', data: vehicleFinancials.map((item) => item.totalRevenue) },
    { name: "Coût d'Entretien", data: vehicleFinancials.map((item) => item.totalMaintenanceCost) },
    { name: 'Profit Net', data: vehicleFinancials.map((item) => item.netProfit) },
  ];

  return (
    <div className="finance-container">
      <div className="financial-stat-card">
        <div className="icon">💰</div>
        <div className="details">
          <h4>Total Revenue</h4>
          <p>{monthlyRevenue.reduce((acc, item) => acc + item.totalRevenue, 0).toFixed(2)} DT</p>
        </div>
      </div>

      <section className="section">
        <h2>Revenus Mensuels</h2>
        <table>
          <thead>
            <tr>
              <th>Année</th>
              <th>Mois</th>
              <th>Revenu Total (DT)</th>
              <th>Nombre de Locations</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRevenue.map((item, index) => (
              <tr key={index}>
                <td>{item.year}</td>
                <td>{item.month}</td>
                <td>{item.totalRevenue.toFixed(2)} DT</td>
                <td>{item.locationCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />
        <div className="chart-container">
          <Chart options={revenueChartOptions} series={revenueChartSeries} type="area" height={350} />
        </div>
      </section>

      <section className="section">
        <h2>Coûts d'Entretien Mensuels</h2>
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Coût Total (DT)</th>
              <th>Nombre d'Entretiens</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceCosts.map((item, index) => (
              <tr key={index}>
                <td>{item.periode}</td>
                <td>{item.totalCout.toFixed(2)} DT</td>
                <td>{item.nombreEntretiens}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />
        <div className="chart-container">
          <Chart options={maintenanceChartOptions} series={maintenanceChartSeries} type="area" height={350} />
        </div>
      </section>

      <section className="section">
        <h2>Résultats Financiers par Véhicule</h2>
        <table>
          <thead>
            <tr>
              <th>Véhicule</th>
              <th>Revenu Total (DT)</th>
              <th>Coût d'Entretien (DT)</th>
              <th>Profit Net (DT)</th>
            </tr>
          </thead>
          <tbody>
            {vehicleFinancials.map((item, index) => (
              <tr key={index}>
                <td>{item.vehicleName}</td>
                <td>{item.totalRevenue.toFixed(2)} DT</td>
                <td>{item.totalMaintenanceCost.toFixed(2)} DT</td>
                <td>{item.netProfit.toFixed(2)} DT</td>
              </tr>
            ))}
          </tbody>
        </table>
        <br />
        <div className="chart-container">
          <Chart options={vehicleFinancialsChartOptions} series={vehicleFinancialsChartSeries} type="bar" height={350} />
        </div>
      </section>
    </div>
  );
};

export default Financial;
