// components/Patient/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getMyMedicalRecords } from '../../services/ContractService';
import { useHistory } from 'react-router-dom';

const Dashboard = () => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const history = useHistory();

  useEffect(() => {
    const fetchRecords = async () => {
      const records = await getMyMedicalRecords();
      setMedicalRecords(records);
    };
    fetchRecords();
  }, []);

  return (
    <div>
      <h1>Patient Dashboard</h1>
      <button onClick={() => history.push('/patient/grant-access')}>
        Manage Access Requests
      </button>
      <button onClick={() => history.push('/patient/access-history')}>
        View Access History
      </button>
      <h2>Your Medical Records</h2>
      <ul>
        {medicalRecords.map((record, index) => (
          <li key={index}>
            CID: {record.encryptedCID}, Timestamp: {record.timestamp.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
