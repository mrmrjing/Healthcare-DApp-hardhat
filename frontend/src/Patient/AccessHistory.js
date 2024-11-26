// components/Patient/AccessHistory.js
import React, { useEffect, useState } from 'react';
import { getAccessHistory, revokeAccess } from '../../services/blockchain/contractService';

const AccessHistory = () => {
  const [accessLogs, setAccessLogs] = useState([]);

  useEffect(() => {
    const fetchAccessHistory = async () => {
      // Implement getAccessHistory to fetch access logs
      const logs = await getAccessHistory();
      setAccessLogs(logs);
    };
    fetchAccessHistory();
  }, []);

  const handleRevoke = async (providerAddress) => {
    await revokeAccess(providerAddress);
    // Update access logs
    setAccessLogs((prevLogs) =>
      prevLogs.filter((log) => log.provider !== providerAddress)
    );
  };

  return (
    <div>
      <h1>Access History</h1>
      {accessLogs.length > 0 ? (
        <ul>
          {accessLogs.map((log, index) => (
            <li key={index}>
              Provider: {log.provider}, Date: {log.date}
              <button onClick={() => handleRevoke(log.provider)}>
                Revoke Access
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No access history available.</p>
      )}
    </div>
  );
};

export default AccessHistory;
