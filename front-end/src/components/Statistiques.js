import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import {
  Container, Paper, Typography, CircularProgress, Alert, Box, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// Professional color scheme
const COLORS = ['#00C4B4', '#EF4444', '#F59E0B', '#8B5CF6', '#1B263B'];

const VehicleStatsDashboard = () => {
  const [priceData, setPriceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [rentalData, setRentalData] = useState([]);
  const [insuranceData, setInsuranceData] = useState([]);
  const [kilometrageData, setKilometrageData] = useState([]);
  const [vehiclesData, setVehiclesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          priceRes, revenueRes, rentalRes, insuranceRes, kilometrageRes,
        ] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/price-by-brand'),
          axios.get('http://localhost:5000/api/stats/revenue'),
          axios.get('http://localhost:5000/api/stats/rental-frequency'),
          axios.get('http://localhost:5000/api/stats/insurance-alerts'),
          axios.get('http://localhost:5000/api/stats/kilometrage-by-fuel'),
        ]);

        setPriceData(priceRes.data || []);
        setRevenueData(revenueRes.data || []);
        setRentalData(rentalRes.data || []);
        setInsuranceData(insuranceRes.data || []);
        setKilometrageData(kilometrageRes.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch statistics. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChartClick = async (type, category) => {
    if (!category) return;

    try {
      setLoading(true);
      let endpoint = '';
      let title = '';

      if (type === 'brand') {
        endpoint = `http://localhost:5000/api/vehicles/brand/${category}`;
        title = `Vehicles for Brand: ${category}`;
      } else if (type === 'rental') {
        endpoint = `http://localhost:5000/api/vehicles/rental-frequency/${category}`;
        title = `Vehicles with Rental Frequency: ${category}`;
      } else if (type === 'insurance') {
        endpoint = `http://localhost:5000/api/vehicles/insurance/${category}`;
        title = `Vehicles with Insurance Alert: ${category}`;
      } else if (type === 'kilometrage') {
        endpoint = `http://localhost:5000/api/vehicles/fuel/${category}`;
        title = `Vehicles with Fuel Type: ${category}`;
      }

      if (endpoint) {
        const response = await axios.get(endpoint);
        setVehiclesData(response.data || []);
        setModalTitle(title);
        setSelectedCategory(category);
        setModalType(type);
        setModalOpen(true);
      }
    } catch (err) {
      setError('Failed to fetch vehicle details.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalTitle('');
    setSelectedCategory(null);
    setModalType('');
    setVehiclesData([]);
  };

  // Chart Options
  const priceOptions = {
    chart: {
      id: 'average-price-by-brand',
      type: 'area',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      width: '100%',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const brand = priceData[config.dataPointIndex]?._id;
          if (brand) handleChartClick('brand', brand);
        },
      },
    },
    colors: [COLORS[0]],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `$${val.toFixed(2)}`,
    },
    xaxis: { categories: priceData.map((d) => d._id), labels: { style: { fontSize: '12px' } } },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    stroke: { curve: 'smooth', width: 3 },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, dataLabels: { style: { fontSize: '10px' } } } },
    ],
  };

  const revenueOptions = {
    chart: {
      id: 'revenue-over-time',
      type: 'area',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      width: '100%',
    },
    colors: [COLORS[1]],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    dataLabels: {
      enabled: true,
      formatter: (val) => `$${val.toFixed(2)}`,
    },
    xaxis: { 
      categories: revenueData.map((d) => d.date || d._id || 'Unknown'), 
      labels: { style: { fontSize: '12px' } } 
    },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    stroke: { curve: 'smooth', width: 3 },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, dataLabels: { style: { fontSize: '10px' } } } },
    ],
  };

  const rentalOptions = {
    chart: {
      id: 'rental-frequency',
      type: 'bar',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      width: '100%',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const category = rentalData[config.dataPointIndex]?._id;
          if (category) handleChartClick('rental', category);
        },
      },
    },
    colors: [COLORS[2]],
    dataLabels: { enabled: true },
    xaxis: { 
      categories: rentalData.map((d) => d._id), 
      labels: { style: { fontSize: '12px' } } 
    },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, dataLabels: { style: { fontSize: '10px' } } } },
    ],
  };

  const insuranceOptions = {
    chart: {
      id: 'insurance-alerts',
      type: 'donut',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      width: '100%',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const category = insuranceData[config.dataPointIndex]?._id;
          if (category) handleChartClick('insurance', category);
        },
      },
    },
    colors: COLORS,
    labels: insuranceData.map((d) => d._id),
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => `${opts.w.globals.labels[opts.seriesIndex]}: ${val.toFixed(1)}%`,
      style: { fontSize: '14px', fontFamily: 'Roboto, sans-serif', fontWeight: 'bold' },
    },
    legend: { position: 'bottom', fontSize: '14px', fontFamily: 'Roboto, sans-serif' },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) || 0,
            },
          },
        },
      },
    },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, legend: { fontSize: '12px' } } },
    ],
  };

  const kilometrageOptions = {
    chart: {
      id: 'kilometrage-by-fuel',
      type: 'bar',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      width: '100%',
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const fuelType = kilometrageData[config.dataPointIndex]?._id;
          if (fuelType) handleChartClick('kilometrage', fuelType);
        },
      },
    },
    colors: [COLORS[3]],
    dataLabels: {
      enabled: true,
      formatter: (val) => `${Math.round(val)} km`,
    },
    xaxis: { 
      categories: kilometrageData.map((d) => d._id), 
      labels: { style: { fontSize: '12px' } } 
    },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, dataLabels: { style: { fontSize: '10px' } } } },
    ],
  };

  const priceSeries = [{ name: 'Average Price', data: priceData.map((d) => d.avgPrice) }];

  const rentalSeries = [{ name: 'Rental Frequency', data: rentalData.map((d) => d.count || 0) }];
  const insuranceSeries = insuranceData.map((d) => d.count || 0);
  const kilometrageSeries = [{ name: 'Average Kilometrage', data: kilometrageData.map((d) => d.avgKilometrage || 0) }];

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ padding: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} disableGutters sx={{ width: '100%', padding: 0 }}>
      {/* Average Price per Day by Brand */}
      <Paper sx={{ width: '100%', padding: 2, marginBottom: 2 }}>
        <Typography variant="h6" gutterBottom>Average Price per Day by Brand</Typography>
        {priceData.length > 0 ? (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <ReactApexChart
              options={priceOptions}
              series={priceSeries}
              type="area"
              height={400}
              width="100%"
            />
          </Box>
        ) : (
          <Typography>No price data available</Typography>
        )}
      </Paper>

    

      
      {/* Kilometrage by Fuel */}
      <Paper sx={{ width: '100%', padding: 2, marginBottom: 2 }}>
        <Typography variant="h6" gutterBottom>Kilometrage by Fuel Type</Typography>
        {kilometrageData.length > 0 ? (
          <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <ReactApexChart
              options={kilometrageOptions}
              series={kilometrageSeries}
              type="bar"
              height={400}
              width="100%"
            />
          </Box>
        ) : (
          <Typography>No kilometrage data available</Typography>
        )}
      </Paper>

      {/* Modal for Details */}
      <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modalTitle}
          <IconButton onClick={handleModalClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {vehiclesData.length > 0 ? (
            <List>
              {vehiclesData.map((vehicle) => (
                <ListItem key={vehicle._id}>
                  <ListItemText
                    primary={`${vehicle.marque} ${vehicle.modele}`}
                    secondary={`Immatriculation: ${vehicle.immatriculation}`}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography>No vehicles found.</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default VehicleStatsDashboard;