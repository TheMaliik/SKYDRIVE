import React, { useState } from "react";
import "./Login.css";
import logo from "../img/skydrive.png"; // Logo de SkyDrive

// Composant Input personnalisé
const InputField = ({ type, placeholder, value, onChange, icon, onIconClick }) => (
  <div className="input-container">
    <i className={`fas ${icon} input-icon`} onClick={onIconClick}></i>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field"
    />
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");

  // Gérer la visibilité du mot de passe
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  // Gérer les changements dans les champs d'entrée
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  // Soumettre le formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "" || password === "") {
      setError("Veuillez remplir tous les champs.");
    } else {
      setError("");
      // Logique de soumission ici (authentification, redirection, etc.)
      console.log("Formulaire soumis");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1><strong className="welcome-text">Welcome</strong> Back</h1>
        <p className="info-text">Veuillez entrer vos informations pour vous connecter.</p>
        
        {/* Email avec icône de cadenas */}
        <InputField
          type="email"
          placeholder="Email"
          value={email}
          onChange={handleEmailChange}
          icon="fa-lock"
        />

        {/* Mot de passe avec icône d'œil */}
        <InputField
          type={passwordVisible ? "text" : "password"}
          placeholder="Mot de passe"
          value={password}
          onChange={handlePasswordChange}
          icon={passwordVisible ? "fa-eye-slash" : "fa-eye"}
          onIconClick={togglePasswordVisibility}
        />

        {/* Affichage d'erreur */}
        {error && <p className="error-text">{error}</p>}

        <button className="admin-btn">Connectez-vous en tant qu'administrateur</button>
        <div className="divider"><span>OU</span></div>
        <button className="login-btn" onClick={handleSubmit}>Se connecter</button>
      </div>
      <div className="logo-container">
        <img src={logo} alt="SkyDrive Cars Logo" className="logo" />
      </div>
    </div>
  );
};

export default Login;
