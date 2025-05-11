import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/GestionEmployes.css';

const GestionEmployes = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cinError, setCinError] = useState('');
  const [isCinValid, setIsCinValid] = useState(false);

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
          setCinError('Le CIN doit contenir exactement 8 chiffres.');
        }
      }
    } else {
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
    setShowForm(false);
  };

  const handleShowHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/history');
      setHistory(res.data.data || []);
      setShowHistory(true);
    } catch (err) {
      console.error("Erreur lors du chargement de l'historique :", err);
      toast.error("Erreur lors du chargement de l'historique");
    }
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
    <div className="gestion-employes">
      <h2>Gestion des Employés</h2>

      <div className="btn-actions">
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Fermer le formulaire' : 'Ajouter un Employé'}
        </button>
        <button onClick={handleShowHistory}>Voir l'historique de connexion</button>
        <button onClick={exportToPDF}>Exporter PDF</button>
      </div>

      {showForm && (
        <div className="form-employee">
          <input
            name="cin"
            value={newEmployee.cin}
            onChange={handleChange}
            placeholder="CIN"
            maxLength="8"
          />
          {cinError && <p className="error">{cinError}</p>}

          <input
            name="prenom"
            value={newEmployee.prenom}
            onChange={handleChange}
            placeholder="Prénom"
            disabled={!isCinValid}
          />
          <input
            name="nom"
            value={newEmployee.nom}
            onChange={handleChange}
            placeholder="Nom"
            disabled={!isCinValid}
          />
          <input
            name="phone"
            value={newEmployee.phone}
            onChange={handleChange}
            placeholder="Téléphone"
            disabled={!isCinValid}
          />
          <input
            name="email"
            value={newEmployee.email}
            onChange={handleChange}
            placeholder="Email"
            disabled={!isCinValid}
          />
          <input
            name="address"
            value={newEmployee.address}
            onChange={handleChange}
            placeholder="Adresse"
            disabled={!isCinValid}
          />
          <input
            name="ville"
            value={newEmployee.ville}
            onChange={handleChange}
            placeholder="Ville"
            disabled={!isCinValid}
          />
          <select
            name="role"
            value={newEmployee.role}
            onChange={handleChange}
            disabled={!isCinValid}
          >
            <option value="user">Employé</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleAddOrUpdateEmployee}
            disabled={loading || !isCinValid}
          >
            {editEmployeeId ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editEmployeeId && (
            <button onClick={resetForm}>Annuler</button>
          )}
        </div>
      )}

      <div className="employee-list">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
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
                <td>{emp.phone}</td>
                <td>{emp.ville}</td>
                <td>{emp.role}</td>
                <td>
                  <button onClick={() => handleEdit(emp)}>Modifier</button>
                  <button onClick={() => handleDelete(emp._id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showHistory && (
        <div className="history">
          <h3>Historique de connexion</h3>
          <button onClick={() => setShowHistory(false)}>Fermer l'historique</button>
          <ul>
            {history.map((record, index) => (
              <li key={index}>
                {record.user} - {new Date(record.date).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

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
      />
    </div>
  );
};

export default GestionEmployes;