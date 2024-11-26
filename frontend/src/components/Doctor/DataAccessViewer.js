import React, { useEffect, useState } from 'react';
import { getPatientRecords } from '../../services/blockchain/contractService'; // Updated path

const DataAccessViewer = ({ patientAddress }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientRecords = async () => {
      if (!patientAddress) {
        setError('Patient address is required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const records = await getPatientRecords(patientAddress);
        setMedicalRecords(records);
      } catch (err) {
        console.error('Error fetching patient records:', err);
        setError('Failed to load patient records.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientRecords();
  }, [patientAddress]);

  if (loading) {
    return <p>Loading patient data...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="data-access-viewer">
      <h2>Patient Medical Records</h2>
      {medicalRecords.length > 0 ? (
        <table className="medical-records-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicalRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.date}</td>
                <td>{record.type}</td>
                <td>{record.description}</td>
                <td>
                  <a href={record.cid} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No records found.</p>
      )}
    </div>
  );
};

export default DataAccessViewer;
