
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactApexChart from 'react-apexcharts';
import {
  Container, Grid, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Alert, Box, Card, CardContent, Dialog, DialogTitle, DialogContent,
  List, ListItem, ListItemText, AppBar, Toolbar, IconButton,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';
import '../styles/VehicleStatsDashboard.css';

// Professional color scheme
const COLORS = ['#1B263B', '#00C4B4', '#EF4444', '#F59E0B', '#8B5CF6'];

const VehicleStatsDashboard = () => {
  const [statusData, setStatusData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [priceData, setPriceData] = useState([]);
  const [ageData, setAgeData] = useState([]);
  const [revenue, setRevenue] = useState(0);
  const [rentalData, setRentalData] = useState([]);
  const [insuranceData, setInsuranceData] = useState([]);
  const [kilometrageData, setKilometrageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ title: '', vehicles: [] });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [
          statusRes, fuelRes, priceRes, ageRes, revenueRes, rentalRes, insuranceRes, kilometrageRes,
        ] = await Promise.all([
          axios.get('http://localhost:5000/api/stats/status'),
          axios.get('http://localhost:5000/api/stats/fuel'),
          axios.get('http://localhost:5000/api/stats/price-by-brand'),
          axios.get('http://localhost:5000/api/stats/age'),
          axios.get('http://localhost:5000/api/stats/revenue'),
          axios.get('http://localhost:5000/api/stats/rental-frequency'),
          axios.get('http://localhost:5000/api/stats/insurance-alerts'),
          axios.get('http://localhost:5000/api/stats/kilometrage-by-fuel'),
        ]);

        setStatusData(statusRes.data || []);
        setFuelData(fuelRes.data || []);
        setPriceData(priceRes.data || []);
        setAgeData(ageRes.data || []);
        setRevenue(revenueRes.data || 0);
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

    fetchStats();
  }, []);

  const handleChartClick = async (event, chartContext, config) => {
    const { seriesIndex, dataPointIndex } = config;
    if (dataPointIndex === -1) return;

    const type = chartContext.opts.chart.id.includes('status') ? 'status' : 'fuel';
    const data = type === 'status' ? statusData[dataPointIndex] : fuelData[dataPointIndex];

    if (!data || !data._id) {
      setError('Invalid data selected.');
      return;
    }

    try {
      let endpoint = '';
      let title = '';
      if (type === 'status') {
        endpoint = `http://localhost:5000/api/vehicles/status/${data._id}`;
        title = `Vehicles with Status: ${data._id}`;
      } else {
        endpoint = `http://localhost:5000/api/vehicles/fuel/${data._id}`;
        title = `Vehicles with Fuel Type: ${data._id}`;
      }
      const response = await axios.get(endpoint);
      setModalData({ title, vehicles: response.data || [] });
      setModalOpen(true);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError('Failed to fetch vehicle details.');
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalData({ title: '', vehicles: [] });
  };

  const pieOptions = (title, labels) => ({
    chart: {
      id: title.toLowerCase().replace(/\s/g, '-'),
      type: 'donut',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    colors: COLORS,
    labels: labels || [],
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
    events: { dataPointSelection: handleChartClick },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, legend: { fontSize: '12px' } } },
    ],
  });

  const areaOptions = (unit, title, categories) => ({
    chart: {
      id: title.toLowerCase().replace(/\s/g, '-'),
      type: 'area',
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
    },
    colors: ['#00C4B4'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.3 } },
    dataLabels: {
      enabled: true,
      formatter: (val) => (unit === '$' ? `$${val.toFixed(2)}` : unit === 'km' ? `${Math.round(val)} km` : val),
    },
    xaxis: { categories: categories || [], labels: { style: { fontSize: '12px' } } },
    yaxis: { labels: { style: { fontSize: '12px' } } },
    stroke: { curve: 'smooth', width: 3 },
    responsive: [
      { breakpoint: 600, options: { chart: { height: 280 }, dataLabels: { style: { fontSize: '10px' } } } },
    ],
  });

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={60} />
        <Typography>Loading Dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container className="error-container">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box className="dashboard-wrapper">
     
      <Container className="dashboard-container">
        <Grid container spacing={3}>
          {/* Average Price per Day by Brand (Full Width at Top) */}
          <Grid item xs={12}>
            <Paper className="chart-card chart-card-prominent">
              <Typography variant="h6">Average Price per Day by Brand</Typography>
              <Box>
                {priceData.length > 0 ? (
                  <ReactApexChart
                    options={areaOptions('$', 'Average Price by Brand', priceData.map((d) => d._id))}
                    series={[{ name: 'Average Price', data: priceData.map((d) => d.avgPrice) }]}
                    type="area"
                    height={400}
                  />
                ) : (
                  <Typography>No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Total Revenue */}
          <Grid item xs={12} sm={6} md={4}>
            <Card className="revenue-card">
              <CardContent>
                <Typography variant="h6">Total Revenue</Typography>
                <Typography variant="h4" color="primary">
                  ${revenue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Status Distribution */}
          <Grid item xs={12} md={6}>
            <Paper className="chart-card">
              <Typography variant="h6">Vehicle Status Distribution</Typography>
              <Box>
                {statusData.length > 0 ? (
                  <ReactApexChart
                    options={pieOptions('Vehicle Status Distribution', statusData.map((d) => d._id))}
                    series={statusData.map((d) => d.count)}
                    type="donut"
                    height={350}
                  />
                ) : (
                  <Typography>No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Fuel Type Distribution */}
          <Grid item xs={12} md={6}>
            <Paper className="chart-card">
              <Typography variant="h6">Vehicle Fuel Type Distribution</Typography>
              <Box>
                {fuelData.length > 0 ? (
                  <ReactApexChart
                    options={pieOptions('Vehicle Fuel Type Distribution', fuelData.map((d) => d._id))}
                    series={fuelData.map((d) => d.count)}
                    type="donut"
                    height={350}
                  />
                ) : (
                  <Typography>No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Age Distribution */}
          <Grid item xs={12}>
            <Paper className="chart-card">
              <Typography variant="h6">Vehicle Age Distribution</Typography>
              <Box>
                {ageData.length > 0 ? (
                  <ReactApexChart
                    options={areaOptions('', 'Vehicle Age Distribution', ageData.map((d) => d._id))}
                    series={[{ name: 'Vehicle Count', data: ageData.map((d) => d.count) }]}
                    type="area"
                    height={350}
                  />
                ) : (
                  <Typography>No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Rental Frequency */}
          <Grid item xs={12}>
            <Paper className="table-card">
              <Typography variant="h6">Rental Frequency by Vehicle</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Immatriculation</TableCell>
                    <TableCell>Marque</TableCell>
                    <TableCell>Modèle</TableCell>
                    <TableCell>Rentals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rentalData.length > 0 ? (
                    rentalData.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{row.immatriculation}</TableCell>
                        <TableCell>{row.marque}</TableCell>
                        <TableCell>{row.modele}</TableCell>
                        <TableCell>{row.rentalCount}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Insurance Alerts */}
          <Grid item xs={12}>
            <Paper className="table-card">
              <Typography variant="h6">Insurance Expiring Soon</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Immatriculation</TableCell>
                    <TableCell>Marque</TableCell>
                    <TableCell>Modèle</TableCell>
                    <TableCell>Expires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {insuranceData.length > 0 ? (
                    insuranceData.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{row.immatriculation}</TableCell>
                        <TableCell>{row.marque}</TableCell>
                        <TableCell>{row.modele}</TableCell>
                        <TableCell>{new Date(row.assurance).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Average Kilometrage by Fuel */}
          <Grid item xs={12}>
            <Paper className="chart-card">
              <Typography variant="h6">Average Kilometrage by Fuel Type</Typography>
              <Box>
                {kilometrageData.length > 0 ? (
                  <ReactApexChart
                    options={areaOptions('km', 'Average Kilometrage by Fuel', kilometrageData.map((d) => d._id))}
                    series={[{ name: 'Average Kilometrage', data: kilometrageData.map((d) => d.avgKilometrage) }]}
                    type="area"
                    height={350}
                  />
                ) : (
                  <Typography>No data available</Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Modal for chart click details */}
        <Dialog open={modalOpen} onClose={handleModalClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modalData.title}
            <IconButton onClick={handleModalClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {modalData.vehicles.length > 0 ? (
              <List>
                {modalData.vehicles.map((vehicle) => (
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
    </Box>
  );
};

export default VehicleStatsDashboard;
