import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast, ToastContainer } from 'react-toastify';
import '../styles/GestionEmployes.css';

const GestionEmployes = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cinError, setCinError] = useState('');
  const [isCinValid, setIsCinValid] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    cin: '',
    prenom: '',
    nom: '',
    email: '',
    phone: '',
    address: '',
    ville: '',
    role: 'user',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des employés :", err);
      toast.error("Erreur lors du chargement des employés");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cin') {
      const onlyDigits = /^\d{0,8}$/;
      if (onlyDigits.test(value)) {
        setNewEmployee({ ...newEmployee, cin: value });

        if (value.length === 8) {
          setIsCinValid(true);
          setCinError('');
        } else {
          setIsCinValid(false);
          setCinError(value.length > 0 ? 'Le CIN doit contenir exactement 8 chiffres.' : '');
        }
      }
    } 
    else if (name === 'phone') {
      const onlyDigits = /^\d{0,8}$/;
      if (onlyDigits.test(value)) {
        setNewEmployee({ ...newEmployee, phone: value });

        if (value.length === 8) {
          setIsPhoneValid(true);
          setPhoneError('');
        } else {
          setIsPhoneValid(false);
          setPhoneError(value.length > 0 ? 'Le téléphone doit contenir exactement 8 chiffres.' : '');
        }
      }
    }
    else {
      setNewEmployee({ ...newEmployee, [name]: value });
    }
  };

  const handleAddOrUpdateEmployee = async () => {
    const { cin, nom, prenom, email, phone, address, ville, role } = newEmployee;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!cin || !nom || !prenom || !email || !phone || !address || !ville) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (!emailRegex.test(email)) {
      toast.error("Veuillez entrer un email valide.");
      return;
    }

    if (!isPhoneValid) {
      toast.error("Le numéro de téléphone doit contenir 8 chiffres");
      return;
    }

    try {
      setLoading(true);
      const payload = { cin, prenom, nom, email, phone, address, ville, role };

      if (editEmployeeId) {
        await axios.put(`http://localhost:5000/api/users/${editEmployeeId}`, payload);
        toast.success("Employé mis à jour !");
      } else {
        await axios.post('http://localhost:5000/api/users', { ...payload, password: 'temp1234' });
        toast.success("Employé ajouté avec succès !");
        try {
          await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
        } catch (mailErr) {
          console.warn("Erreur lors de l'envoi de l'email :", mailErr.message);
        }
      }

      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error("Erreur :", error);
      toast.error(`Erreur : ${error.response?.data?.message || error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchEmployees();
        toast.success("Employé supprimé avec succès !");
      } catch (err) {
        console.error("Erreur lors de la suppression :", err);
        toast.error("Erreur lors de la suppression de l'employé.");
      }
    }
  };

  const handleEdit = (emp) => {
    setNewEmployee({
      cin: emp.cin || '',
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      phone: emp.phone || '',
      address: emp.address || '',
      ville: emp.ville || '',
      role: emp.role || 'user',
    });
    setEditEmployeeId(emp._id);
    setIsCinValid(emp.cin && emp.cin.length === 8);
    setIsPhoneValid(emp.phone && emp.phone.length === 8);
    setShowForm(true);
  };

  const resetForm = () => {
    setNewEmployee({
      cin: '',
      prenom: '',
      nom: '',
      email: '',
      phone: '',
      address: '',
      ville: '',
      role: 'user',
    });
    setEditEmployeeId(null);
    setIsCinValid(false);
    setIsPhoneValid(false);
    setCinError('');
    setPhoneError('');
    setShowForm(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des Employés", 14, 10);
    const tableColumn = ["Nom", "Email", "Téléphone", "Ville", "Rôle"];
    const tableRows = employees.map(emp => [
      `${emp.prenom} ${emp.nom}`,
      emp.email,
      emp.phone || '',
      emp.ville || '',
      emp.role
    ]);
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("liste_employes.pdf");
  };

  return (
    <div className="gestion-employes-container">
      <h2 className="page-title">Liste des Employés</h2>

      <div className="action-buttons">
        <button 
          className={`toggle-form-btn ${showForm ? 'active' : ''}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Fermer le formulaire' : 'Ajouter un Employé'}
        </button>
        <button className="export-btn" onClick={exportToPDF}>
          Exporter PDF
        </button>
      </div>

      {showForm && (
        <div className="employee-form-container">
          <div className="form-row cin-row">
            <label htmlFor="cin">CIN</label>
            <input
              id="cin"
              name="cin"
              type="text"
              value={newEmployee.cin}
              onChange={handleChange}
              maxLength="8"
              className={`form-input ${cinError ? 'input-error' : ''}`}
              aria-describedby="cin-error"
            />
            {cinError && (
              <span id="cin-error" className="error-message">
                {cinError}
              </span>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="prenom">Prénom</label>
            <input
              id="prenom"
              name="prenom"
              type="text"
              value={newEmployee.prenom}
              onChange={handleChange}
              className="form-input"
              disabled={!isCinValid}
            />
          </div>

          <div className="form-row">
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              name="nom"
              type="text"
              value={newEmployee.nom}
              onChange={handleChange}
              className="form-input"
              disabled={!isCinValid}
            />
          </div>

          <div className="form-row">
            <label htmlFor="phone">Téléphone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={newEmployee.phone}
              onChange={handleChange}
              maxLength="8"
              className={`form-input ${phoneError ? 'input-error' : ''}`}
              disabled={!isCinValid}
              aria-describedby="phone-error"
            />
            {phoneError && (
              <span id="phone-error" className="error-message">
                {phoneError}
              </span>
            )}
          </div>

          <div className="form-row">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={newEmployee.email}
              onChange={handleChange}
              className="form-input"
              disabled={!isCinValid || !isPhoneValid}
            />
          </div>

          <div className="form-row">
            <label htmlFor="address">Adresse</label>
            <input
              id="address"
              name="address"
              type="text"
              value={newEmployee.address}
              onChange={handleChange}
              className="form-input"
              disabled={!isCinValid || !isPhoneValid}
            />
          </div>

          <div className="form-row">
            <label htmlFor="ville">Ville</label>
            <input
              id="ville"
              name="ville"
              type="text"
              value={newEmployee.ville}
              onChange={handleChange}
              className="form-input"
              disabled={!isCinValid || !isPhoneValid}
            />
          </div>

          <div className="form-row">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              name="role"
              value={newEmployee.role}
              onChange={handleChange}
              className="form-select"
              disabled={!isCinValid || !isPhoneValid}
            >
              <option value="user">Employé</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <button
              className={`submit-btn ${loading ? 'loading' : ''}`}
              onClick={handleAddOrUpdateEmployee}
              disabled={loading || !isCinValid || !isPhoneValid}
            >
              {loading ? 'Traitement...' : editEmployeeId ? 'Mettre à jour' : 'Ajouter'}
            </button>

            {editEmployeeId && (
              <button className="cancel-btn" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </div>
      )}

      <div className="employees-table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Nom Complet</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Ville</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id}>
                <td>{emp.prenom} {emp.nom}</td>
                <td>{emp.email}</td>
                <td>{emp.phone || '-'}</td>
                <td>{emp.ville || '-'}</td>
                <td className={`role-${emp.role}`}>
                  {emp.role === 'admin' ? 'Admin' : 'Employé'}
                </td>
                <td className="actions-cell">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(emp)}
                  >
                    Modifier
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(emp._id)}
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default GestionEmployes;