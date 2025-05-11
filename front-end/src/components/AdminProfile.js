import React, { useState, useEffect, useRef } from "react";
import "../styles/AdminProfile.css";
import { FaCog, FaEye, FaEyeSlash } from "react-icons/fa"; // Importation des icônes
import axios from "axios";

const Section = ({ icon, title, actions }) => (
  <section className="section">
    <h3>{icon} {title}</h3>
    <div className="section-actions">
      {actions.map((action, idx) =>
        React.isValidElement(action) ? (
          <div key={idx}>{action}</div>
        ) : (
          <button key={idx} className="btn">{action}</button>
        )
      )}
    </div>
  </section>
);

const AdminProfile = () => {
  const [profilePic, setProfilePic] = useState("https://via.placeholder.com/150");
  const [tempPic, setTempPic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("Takwa Teka");
  const [email, setEmail] = useState("tekatakwa@gmail.com");
  const [password, setPassword] = useState("");

  // Nouveaux états pour la gestion des mots de passe
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Nouvel état pour la visibilité des mots de passe
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gérer l'affichage du formulaire de modification de mot de passe
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Référence pour détecter les clics à l'extérieur
  const passwordFormRef = useRef(null);

  useEffect(() => {
    const storedProfilePic = localStorage.getItem("profilePic") || "https://via.placeholder.com/150";
    setProfilePic(storedProfilePic);

    // Ajouter un écouteur de clic pour fermer le formulaire si l'on clique en dehors
    const handleClickOutside = (event) => {
      if (passwordFormRef.current && !passwordFormRef.current.contains(event.target)) {
        setIsChangingPassword(false); // Fermer le formulaire si on clique en dehors
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setTempPic(previewUrl);
      } else {
        alert('Veuillez sélectionner une image valide.');
      }
    }
  };

  const handleProfilePicUpdate = () => {
    if (tempPic) {
      setProfilePic(tempPic);
      localStorage.setItem("profilePic", tempPic);  // Sauvegarde de l'image dans le localStorage
      setTempPic(null);
    }
  };

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const updatedData = {
        name,
        email,
        role: "admin",
      };

      if (password) {
        updatedData.password = password;
      }

      await axios.put(`http://localhost:5000/api/users/edit/${userId}`, updatedData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setIsEditing(false);
      setPassword(""); // reset input mot de passe
      alert("Profil mis à jour avec succès !");
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      alert("Échec de la mise à jour du profil.");
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `http://localhost:5000/api/users/change-password/${userId}`,
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message); // Affiche le message de succès
      setOldPassword(""); // Reset des champs de mot de passe
      setNewPassword("");
      setConfirmNewPassword("");
      setIsChangingPassword(false); // Cacher le formulaire après changement
    } catch (error) {
      alert(error.response.data.message); // Affiche le message d'erreur
    }
  };

  return (
    <div className="admin-profile">
      <div className="profile-info">
        <label htmlFor="profilePicInput">
          <img src={tempPic || profilePic} alt="Profile" className="profile-pic" />
        </label>
        <input
          type="file"
          id="profilePicInput"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <div className="user-details">
          {isEditing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="edit-input"
                placeholder="Nom"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="edit-input"
                placeholder="Email"
              />
            </>
          ) : (
            <>
              <h2>{name}</h2>
              <p>{email}</p>
            </>
          )}
        </div>
      </div>

      {/* Section de modification des informations du profil */}
      <Section
        icon={<FaCog />}
        title="Personnalisation"
        actions={[
          <button
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
            className="btn"
          >
            {isEditing ? "Enregistrer les modifications" : "Modifier les informations du profil"}
          </button>,
          <button
            onClick={handleProfilePicUpdate}
            className="btn"
            disabled={!tempPic}
          >
            Changer la photo de profil
          </button>
        ]}
      />

      {/* Section de modification du mot de passe */}
      <Section
        icon={<FaCog />}
        title="Sécurité"
        actions={[
          !isChangingPassword ? (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="btn"
            >
              Modifier le mot de passe
            </button>
          ) : (
            <div ref={passwordFormRef}>
              <input
                type={showOldPassword ? "text" : "password"} // Afficher ou masquer le mot de passe
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="edit-input"
                placeholder="Ancien mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)} // Toggle visibilité
                className="toggle-password"
              >
                {showOldPassword ? <FaEyeSlash /> : <FaEye />} {/* Afficher l'icône en fonction de la visibilité */}
              </button>
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="edit-input"
                placeholder="Nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)} // Toggle visibilité
                className="toggle-password"
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="edit-input"
                placeholder="Confirmer le nouveau mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle visibilité
                className="toggle-password"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              <button
                onClick={handleChangePassword}
                className="btn"
              >
                Enregistrer le nouveau mot de passe
              </button>
            </div>
          )
        ]}
      />
    </div>
  );
};

export default AdminProfile;
