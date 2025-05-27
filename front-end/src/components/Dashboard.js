import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");

  useEffect(() => {
    const isLoggedIn =
      localStorage.getItem("isLoggedIn") === "true" && localStorage.getItem("token");
      
  console.log('isLoggedIn:', isLoggedIn);

    if (!isLoggedIn) {
      navigate("/login", { replace: true });
    } else {
      const userRole = localStorage.getItem("role");
      setRole(userRole);
    }
  }, [navigate]);

  return (
    <div className="dashboard-page">
      {role === "admin" ? (
        <div className="role-specific">
          <h1>Tableau de bord de l'admin</h1>
          <div className="admin-actions">
            <div>Gestion des véhicules</div>
            <div>Gestion des locations</div>
            <div>Rapports et statistiques</div>
          </div>
        </div>
      ) : (
        <div className="access-restricted">
          <h1>Accès restreint</h1>
          <p>Ce tableau de bord est uniquement accessible aux administrateurs.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
