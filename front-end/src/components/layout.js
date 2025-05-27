import React, { useState, useEffect, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaUser, FaMoon, FaSignOutAlt } from "react-icons/fa";

import "../styles/Layout.css";

// Pages chargées dynamiquement
const Dashboard = React.lazy(() => import("./StatCard"));
const AdminProfile = React.lazy(() => import("./AdminProfile"));
const EmployeeProfile = React.lazy(() => import("./EmployeeProfile"));
const Calendar = React.lazy(() => import("./Calendar"));
const GestionClient = React.lazy(() => import("./GestionClient"));
const GestionLocation = React.lazy(() => import("./GestionLocation"));
const GestionMaintenance = React.lazy(() => import("./GestionMaintenance"));
const GestionVehicules = React.lazy(() => import("./GestionVehicules"));
const GestionEmployes = React.lazy(() => import("./GestionEmployes"));
const Notifications = React.lazy(() => import("./Notifications"));
const Financial = React.lazy(() => import("./Financial")); 
const ContratLocation = React.lazy(() => import("./ContratLocation")); 
const Contracts = React.lazy(() => import("./Contracts")); 
const Statistiques = React.lazy(() => import("./Statistiques")); 

const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

const Layout = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [modeText, setModeText] = useState("Mode sombre");
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [pageTitle, setPageTitle] = useState("Tableau de bord");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true" && localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");

    if (!isLoggedIn || !storedRole) {
      navigate("/login", { replace: true });
    } else {
      setRole(storedRole);
      console.log("Role:", storedRole);
    }
  }, [navigate]);

  useEffect(() => {
    const titles = {
      Dashboard: "Tableau de bord",
      AdminProfile: "Profil",
      EmployeeProfile: "Profil",
      Calendar: "Calendrier",
      GestionClient: "Gestion Clients",
      GestionLocation: "Gestion Locations",
      GestionMaintenance: "Gestion Maintenance",
      GestionVehicules: "Gestion Véhicules",
      GestionEmployes: "Gestion Employés",
      Notifications: "Notifications",
      Financial: "Suivi Financier",
      ContratLocation: "Contrat de Location",
      Statistiques: "Statistiques",
      Contracts: "Contrats"
    };
    setPageTitle(titles[currentPage] || "SkyDrive");
    document.title = `${titles[currentPage] || "SkyDrive"} | SkyDrive`;
  }, [currentPage]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.body.classList.toggle("dark-mode", savedDarkMode);
    setModeText(savedDarkMode ? "Mode clair" : "Mode sombre");
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleDarkMode = (event) => {
    event.stopPropagation();
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode);
    document.body.classList.toggle("dark-mode", newDarkMode);
    setModeText(newDarkMode ? "Mode clair" : "Mode sombre");
  };

  const handleLogout = () => {
    if (window.confirm("Êtes-vous sûr(e) de vouloir vous déconnecter ?")) {
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const changePage = async (pageName) => {
    setLoading(true);
    console.log("Changing page to:", pageName);
    setCurrentPage(pageName);
    setIsMenuOpen(false);
    await new Promise(resolve => setTimeout(resolve, 200));
    setLoading(false);
  };

  useEffect(() => {
    const handleChangePage = (event) => {
      const pageName = event.detail;
      changePage(pageName);
    };

    window.addEventListener("changePage", handleChangePage);

    return () => {
      window.removeEventListener("changePage", handleChangePage);
    };
  }, []);

  const renderPage = () => {
    if (role === "admin") {
      switch (currentPage) {
        case "Dashboard":
          return <Dashboard onNavigate={changePage} />;
        case "AdminProfile":
          return <AdminProfile />;
        case "Calendar":
          return <Calendar />;
        case "GestionClient":
          return <GestionClient />;
        case "GestionLocation":
          return <GestionLocation />;
        case "GestionMaintenance":
          return <GestionMaintenance />;
        case "GestionVehicules":
          return <GestionVehicules />;
        case "GestionEmployes":
          return <GestionEmployes />;
        case "Notifications":
          return <Notifications />;
        case "Financial":
          return <Financial />;
        case "ContratLocation":
          return <ContratLocation />;
        case "Statistiques":
          return <Statistiques />;
        case "Contracts":
          return <Contracts />;
        default:
          return <Dashboard onNavigate={changePage} />;
      }
    } else if (role === "user") {
      switch (currentPage) {
        case "Dashboard":
          return <Dashboard onNavigate={changePage} />;
        case "EmployeeProfile":
          return <EmployeeProfile />;
        case "Calendar":
          return <Calendar />;
        case "GestionClient":
          return <GestionClient />;
        case "GestionLocation":
          return <GestionLocation />;
        case "GestionMaintenance":
          return <GestionMaintenance />;
        case "GestionVehicules":
          return <GestionVehicules />;
        case "Notifications":
          return <Notifications />;
        case "Contracts":
          return <Contracts />;
        case "ContratLocation":
          return <ContratLocation />;
        default:
          return <Dashboard onNavigate={changePage} />;
      }
    }
  };

  const menuItems = role === "admin"
    ? [
        { name: "Dashboard", label: "Tableau de bord" },
        { name: "AdminProfile", label: "Profil" },
        { name: "Calendar", label: "Calendrier" },
        { name: "GestionClient", label: "Clients" },
        { name: "GestionLocation", label: "Locations" },
        { name: "GestionMaintenance", label: "Maintenance" },
        { name: "GestionVehicules", label: "Véhicules" },
        { name: "GestionEmployes", label: "Employés" },
        { name: "Notifications", label: "Notifications" },
        { name: "Financial", label: "Suivi Financier" },
        { name: "ContratLocation", label: "Contrat de Location" },
        { name: "Statistiques", label: "Statistiques" },
        { name: "Contracts", label: "Contracts" }
      ]
    : [
        { name: "Dashboard", label: "Tableau de bord" },
        { name: "EmployeeProfile", label: "Profil" },
        { name: "Calendar", label: "Calendrier" },
        { name: "GestionClient", label: "Clients" },
        { name: "GestionLocation", label: "Locations" },
        { name: "GestionMaintenance", label: "Maintenance" },
        { name: "GestionVehicules", label: "Véhicules" },
        { name: "Notifications", label: "Notifications" },
        { name: "ContratLocation", label: "Contrat de Location" },
        { name: "Contracts", label: "Contracts" }
      ];

  return (
    <div className={`layout ${darkMode ? "dark-mode" : ""}`}>
      <Sidebar
        onPageChange={changePage}
        currentPage={currentPage}
        darkMode={darkMode}
        menuItems={menuItems}
      />

      <div className="main-content">
        <header className="top-bar">
          <h1>{pageTitle}</h1>
          <div className="admin-menu-container" ref={menuRef}>
            <div className="profile-icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <FaUser size={30} />
            </div>

            {isMenuOpen && (
              <ul className={`admin-menu ${isMenuOpen ? "show" : ""}`}>
                <li onClick={() => changePage(role === "admin" ? "AdminProfile" : "EmployeeProfile")}>
                  <FaUser /> Profil
                </li>
                <li onClick={toggleDarkMode}>
                  <FaMoon /> {modeText}
                </li>
                <li onClick={handleLogout}>
                  <FaSignOutAlt /> Se déconnecter
                </li>
              </ul>
            )}
          </div>
        </header>

        <div className="content-wrapper">
          <Suspense fallback={<LoadingSpinner />}>
            {loading ? <LoadingSpinner /> : renderPage()}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default Layout;