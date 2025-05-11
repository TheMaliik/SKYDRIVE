import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css"; 
import { API_AUTH } from "../api";

const ResetPassword = () => {
  const { token } = useParams();  
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Vérifier la validité du token au chargement de la page
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.get(`/api/auth/reset-password/${token}`);
        console.log(response); 
      } catch (err) {
        console.error(err); 
        setError("Token invalide ou expiré.");
      }
    };
  
    verifyToken();
  }, [token]);
  
  const isPasswordStrong = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
  
    if (!isPasswordStrong(newPassword)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      const { data } = await axios.put(`${API_AUTH}/reset-password/${token}`, { newPassword });
  
      setSuccessMessage(data.message || "Mot de passe réinitialisé avec succès.");
      setNewPassword("");
      setConfirmPassword("");
  
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error(error);  
      setError(error.response?.data?.message || "Une erreur s’est produite.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1><strong className="welcome-text">Réinitialisation</strong> du mot de passe</h1>

        {error && <p className="error-text">{error}</p>}
        {successMessage && <p className="success-text">{successMessage}</p>}

        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="input-container">
            <input
              type="password"
              placeholder="Confirmez le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>

        <p
          onClick={() => navigate("/login")}
          style={{ marginTop: "10px", cursor: "pointer", color: "#555" }}
        >
          ← Retour à la connexion
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
