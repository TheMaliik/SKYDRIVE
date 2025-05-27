import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/ContractsList.css';

const ContractsList = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsPerPage] = useState(10);

  // Fetch contracts
  const fetchContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/contracts');
      const data = Array.isArray(response.data.contracts) ? response.data.contracts : [];
      setContracts(data);
      if (data.length === 0) {
        toast.warn('Aucun contrat trouvé');
      } else {
        toast.success('Contrats chargés avec succès !');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des contrats :', err);
      const errorMessage = err.response?.data?.error || 'Échec du chargement des contrats';
      setError(errorMessage);
      setContracts([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDelete = async (contractId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/contracts/${contractId}`);
      toast.success('Contrat supprimé avec succès');
      fetchContracts();
    } catch (err) {
      console.error('Erreur lors de la suppression du contrat :', err);
      const errorMessage = err.response?.data?.error || 'Échec de la suppression';
      toast.error(errorMessage);
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.locationId?.statut?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container contracts-list">
      <h1 className="title">Aperçu des contrats</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par statut..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Chargement des contrats...</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Prix (TTC)</th>
                  <th>Statut</th>
                  <th>PDF</th>
                  <th>Généré le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentContracts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">Aucun contrat trouvé</td>
                  </tr>
                ) : (
                  currentContracts.map((contract) => (
                    <tr key={contract._id}>
                      <td>{formatDate(contract.locationId.startDate)}</td>
                      <td>{formatDate(contract.locationId.endDate)}</td>
                      <td>{contract.locationId.prixTTC.toFixed(2)} TND</td>
                      <td className={`status-${contract.locationId.statut}`}>
                        {contract.locationId.statut}
                      </td>
                      <td>
                        <a
                          href={contract.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pdf-link"
                        >
                          Voir le PDF
                        </a>
                      </td>
                      <td>{formatDate(contract.generatedAt)}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(contract._id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Précédent
              </button>
              <span className="pagination-info">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractsList;
