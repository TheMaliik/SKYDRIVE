import React, { useEffect, useState } from "react";
import axios from "axios";

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(() => {
    // Retrieve employee data from localStorage if it exists
    const savedEmployee = localStorage.getItem("employee");
    return savedEmployee ? JSON.parse(savedEmployee) : {};
  });
  const [file, setFile] = useState(null); // Pour gérer le fichier d'image
  const [loading, setLoading] = useState(false); // Pour afficher un indicateur de chargement
  const userId = localStorage.getItem("userId"); // récupéré après login

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const response = await axios.get(`/api/users/${userId}`);
        setEmployee(response.data);

        // Save the employee data to localStorage
        localStorage.setItem("employee", JSON.stringify(response.data));
      } catch (error) {
        console.error("Erreur lors du chargement du profil :", error);
      }
    };

    if (userId) {
      fetchEmployee();
    }
  }, [userId]);

  // Fonction pour gérer le changement de photo
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Fonction pour soumettre le fichier à l'API
  const handleUpload = async () => {
    if (!file) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      setLoading(true);
      const response = await axios.post(`/api/users/upload-photo/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Mettre à jour la photo de profil dans l'état après téléchargement
      setEmployee((prevEmployee) => {
        const updatedEmployee = {
          ...prevEmployee,
          photo: response.data.photo,
        };
        // Save the updated employee data to localStorage
        localStorage.setItem("employee", JSON.stringify(updatedEmployee));
        return updatedEmployee;
      });

      setLoading(false);
      alert("Photo mise à jour avec succès.");
    } catch (error) {
      console.error("Erreur lors de l'upload de la photo :", error);
      setLoading(false);
      alert("Une erreur est survenue lors de la mise à jour de la photo.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Profil Employé</h2>

      {employee.photo ? (
        <img
          src={`http://localhost:5000/uploads/${employee.photo}`} // Assurez-vous que le chemin d'accès est correct
          alt={`${employee.nom} ${employee.prenom}`}
          style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", marginBottom: "15px" }}
        />
      ) : (
        <div
          style={{
            width: "150px",
            height: "150px",
            borderRadius: "50%",
            backgroundColor: "#ccc",
            display: "inline-block",
            marginBottom: "15px",
          }}
        />
      )}

      <p>Bienvenue <strong>{employee.prenom} {employee.nom}</strong>.</p>

      <div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading}>
          {loading ? "Chargement..." : "Mettre à jour la photo"}
        </button>
      </div>
    </div>
  );
};

export default EmployeeProfile;
