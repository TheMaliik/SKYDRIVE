import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";
import { API_AUTH } from "../api";

const InputField = ({ type, placeholder, value, onChange, icon, onIconClick }) => (
  <div className="input-container">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input-field"
      required
    />
    <i
      className={`fas ${icon} input-icon`}
      onClick={onIconClick}
      aria-label="Toggle visibility"
      style={{ cursor: onIconClick ? "pointer" : "default" }}
    />
  </div>
);

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const navigate = useNavigate();
  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${API_AUTH}/login`, { email, password });

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", data.role);

        // Tous (admin ou employé) vont vers /dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Erreur de connexion:", error.response?.data);
      setError(error.response?.data?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage("");

    try {
      const res = await axios.post(`${API_AUTH}/forgot-password`, { email: resetEmail });
      setResetMessage(res.data.message || "E-mail de réinitialisation envoyé !");
    } catch (err) {
      setResetMessage(err.response?.data?.message || "Une erreur s’est produite.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1><strong className="welcome-text">Welcome</strong> Back</h1>
        <p className="info-text">Veuillez entrer vos informations pour vous connecter.</p>

        {!showResetForm ? (
          <>
            <form onSubmit={handleSubmit}>
              <InputField
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon="fa-envelope"
              />

              <InputField
                type={passwordVisible ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={passwordVisible ? "fa-eye-slash" : "fa-eye"}
                onIconClick={togglePasswordVisibility}
              />

              {error && <p className="error-text">{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="forgot-password-container">
              <p className="forgot-password-link" onClick={() => setShowResetForm(true)}>
                Mot de passe oublié ?
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword}>
            <InputField
              type="email"
              placeholder="Entrez votre email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              icon="fa-envelope"
            />

            <button type="submit" className="login-btn" style={{ marginTop: "10px" }}>
              Envoyer le lien de réinitialisation
            </button>

            {resetMessage && <p className="info-text" style={{ marginTop: "10px" }}>{resetMessage}</p>}

            <p
              onClick={() => setShowResetForm(false)}
              style={{ marginTop: "10px", cursor: "pointer", color: "#555" }}
            >
              ← Retour à la connexion
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
