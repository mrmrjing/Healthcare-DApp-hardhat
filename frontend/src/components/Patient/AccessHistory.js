import React, { useEffect, useState } from 'react';
import { checkAccess } from '../../services/blockchain/contractService'; // Updated path

const AccessHistory = ({ patientAddress }) => {
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccessLogs = async () => {
      if (!patientAddress) {
        setError('Patient address is required.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Replace this with real data fetching logic
        const logs = [
          {
            doctor: '0x1234...abcd', // Replace with real doctor addresses
            date: '2024-11-20',
            purpose: 'View medical history',
          },
          {
            doctor: '0xabcd...1234',
            date: '2024-11-18',
            purpose: 'View lab results',
          },
        ];

        // Uncomment this for blockchain integration:
        // const logs = await checkAccess(patientAddress, doctorAddress);

        setAccessLogs(logs);
      } catch (err) {
        console.error('Error fetching access logs:', err);
        setError('Failed to load access logs.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessLogs();
  }, [patientAddress]);

  if (loading) {
    return <p>Loading access history...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="access-history">
      <h2>Access History</h2>
      {accessLogs.length > 0 ? (
        <table className="access-history-table">
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {accessLogs.map((log, index) => (
              <tr key={index}>
                <td>{log.doctor}</td>
                <td>{log.date}</td>
                <td>{log.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No access logs found.</p>
      )}
    </div>
  );
};

export default AccessHistory;
