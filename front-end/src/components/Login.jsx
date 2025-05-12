import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../styles/Login.css";
import { API_AUTH } from "../api";

const InputField = ({ type, placeholder, value, onChange, icon, onIconClick }) => (
  <div className="login-input-wrapper">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="login-input-text"
      required
    />
    <i
      className={`fas ${icon} login-input-icon`}
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

    console.log("Submitting with:", { email, password });

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Veuillez entrer un email valide.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Sending to:", `${API_AUTH}/login`);
      const { data } = await axios.post(`${API_AUTH}/login`, {
        email: trimmedEmail,
        password,
      });
      console.log("Response:", data);

      if (!data.token) {
        setError("Token non reçu. Veuillez réessayer.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("role", data.role);

      const decodedToken = jwtDecode(data.token);
      console.log("Decoded token:", decodedToken);

      console.log("Sending user findByEmail request with email:", trimmedEmail);
      const userResponse = await axios.get(
        `http://localhost:5000/apiLogin/user/findByEmail/${encodeURIComponent(trimmedEmail)}`
      );
      console.log("User found:", userResponse.data);

      localStorage.setItem("user", JSON.stringify(userResponse.data));
      navigate("/dashboard");
    } catch (error) {
      console.error("Erreur de connexion:", error.response?.data || error.message);
      setError(error.response?.data?.message || "Une erreur s’est produite lors de la connexion.");
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
    <div className="login-main-container">
      <div className="login-form-box">
        <h1><strong className="login-welcome-text">Welcome</strong> Back</h1>
        <p className="login-info-message">Veuillez entrer vos informations pour vous connecter.</p>

        {!showResetForm ? (
          <>
            <form onSubmit={handleSubmit} className="login-form">
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

              {error && <p className="login-error-message">{error}</p>}

              <button type="submit" className="login-submit-button" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="login-forgot-password-section">
              <p className="login-forgot-password-text" onClick={() => setShowResetForm(true)}>
                Mot de passe oublié ?
              </p>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="login-form">
            <InputField
              type="email"
              placeholder="Entrez votre email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              icon="fa-envelope"
            />

            <button type="submit" className="login-submit-button" style={{ marginTop: "10px" }}>
              Envoyer le lien de réinitialisation
            </button>

            {resetMessage && <p className="login-info-message" style={{ marginTop: "10px" }}>{resetMessage}</p>}

            <p
              onClick={() => setShowResetForm(false)}
              className="login-back-to-login"
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