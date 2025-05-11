import { Routes, Route, Navigate } from "react-router-dom";
import Login from './components/Login';
import Layout from './components/layout'; 
import Dashboard from './components/Dashboard';
import GestionVehicules from './components/GestionVehicules';
import GestionMaintenance from './components/GestionMaintenance';
import GestionLocation from './components/GestionLocation';
import GestionClient from './components/GestionClient';
import AdminProfile from "./components/AdminProfile";
import Calendar from "./components/Calendar";
import GestionEmployes from './components/GestionEmployes';
import Notification from  './components/Notifications';
import Financial from "./components/Financial"; 
import ResetPassword from "./components/ResetPassword";
import ContratLocation from "./components/ContratLocation";
import VehicleStatsDashboard from "./components/Statistiques";

const PrivateRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  return isLoggedIn === "true" ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      {/* Page login non protégée */}
      <Route path="/login" element={<Login />} />

      {/* Route de réinitialisation du mot de passe, non protégée */}
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Route protégée qui redirige vers le login si non connecté */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Navigate to="/login" />  {/* Rediriger vers /login par défaut */}
          </PrivateRoute>
        }
      />

      {/* Toutes les routes protégées avec layout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicules" element={<GestionVehicules />} />
        <Route path="maintenance" element={<GestionMaintenance />} />
        <Route path="location" element={<GestionLocation />} />
        <Route path="client" element={<GestionClient />} />
        <Route path="admin-profile" element={<AdminProfile />} />
        <Route path="calendrier" element={<Calendar />} />
        <Route path="gestion-employes" element={<GestionEmployes />} />
        <Route path="notifications" element={<Notification />} />
        <Route path="financial" element={<Financial />} />
        <Route path="/contrat/:id" element={<ContratLocation />} />
        
        </Route>

      {/* Redirection vers login pour toute autre route non définie */}
      <Route path="*" element={<Navigate to="/login" />} />
      <Route path="Statssss" element={<VehicleStatsDashboard />} />
    </Routes>
  );
}

export default App;
