import React, { useState } from 'react';
import "../styles/Financial.css";

const Financial = () => {
  const [revenus, ] = useState([]);
  const [depenses,] = useState([]);
  const [filtre, setFiltre] = useState('mois');

  const totalRevenus = revenus.reduce((acc, r) => acc + r.montant, 0);
  const totalDepenses = depenses.reduce((acc, d) => acc + d.montant, 0);
  const resultatNet = totalRevenus - totalDepenses;

  return (
    <div className="finance-container">
      <h1>Suivi Financier</h1>

      <div className="filtre-section">
        <label>Filtrer par :</label>
        <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
          <option value="mois">Mois en cours</option>
          <option value="année">Année en cours</option>
          <option value="personnalise">Date personnalisée</option>
        </select>
      </div>

      {/* Tableau des Revenus */}
      <section className="section">
        <h2>Revenus</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            {revenus.map((r, index) => (
              <tr key={index}>
                <td>{r.date}</td>
                <td>{r.client}</td>
                <td>{r.montant} DT</td>
                <td>{r.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Tableau des Dépenses */}
      <section className="section">
        <h2>Dépenses</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {depenses.map((d, index) => (
              <tr key={index}>
                <td>{d.date}</td>
                <td>{d.type}</td>
                <td>{d.montant} DT</td>
                <td>{d.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Bilan */}
      <section className="bilan">
        <h2>Bilan</h2>
        <p><strong>Total Revenus :</strong> {totalRevenus} DT</p>
        <p><strong>Total Dépenses :</strong> {totalDepenses} DT</p>
        <p className={resultatNet >= 0 ? "benefice" : "perte"}>
          <strong>Résultat Net :</strong> {resultatNet} DT
        </p>
      </section>
    </div>
  );
};

export default Financial;
