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

  // Fetch contracts from API
  const fetchContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/contracts');
      const data = Array.isArray(response.data.contracts) ? response.data.contracts : [];
      setContracts(data);
      if (data.length === 0) {
        toast.warn('No contracts found');
      } else {
        toast.success('Contracts loaded successfully!');
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
      const errorMessage = err.response?.data?.error || 'Failed to load contracts';
      setError(errorMessage);
      setContracts([]);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contracts on component mount
  useEffect(() => {
    fetchContracts();
  }, []);

  // Format date for display
  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR');
    } catch {
      return 'Invalid Date';
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter contracts based on search term
  const filteredContracts = contracts.filter((contract) =>
    contract.locationId.statut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const indexOfLastContract = currentPage * contractsPerPage;
  const indexOfFirstContract = indexOfLastContract - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirstContract, indexOfLastContract);
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  // Handle page change
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container contracts-list">
      <h1 className="title">Contracts Overview</h1>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by status..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading contracts...</div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Price (TTC)</th>
                  <th>Status</th>
                  <th>PDF</th>
                  <th>Generated At</th>
                </tr>
              </thead>
              <tbody>
                {currentContracts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="no-data">
                      No contracts found
                    </td>
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
                          View PDF
                        </a>
                      </td>
                      <td>{formatDate(contract.generatedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ContractsList;