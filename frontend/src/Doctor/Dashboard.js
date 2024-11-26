// components/Doctor/Dashboard.js
import React, { useEffect, useState } from 'react';
import { getAuthorizedPatients } from '../../services/ContractService';
import { useHistory } from 'react-router-dom';

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const history = useHistory();

  useEffect(() => {
    const fetchPatients = async () => {
      const authorizedPatients = await getAuthorizedPatients();
      setPatients(authorizedPatients);
    };
    fetchPatients();
  }, []);

  return (
    <div>
      <h1>Doctor Dashboard</h1>
      <button onClick={() => history.push('/doctor/request-data')}>
        Request Data from Patient
      </button>
      <h2>Patients with Access Granted</h2>
      <ul>
        {patients.map((patient, index) => (
          <li key={index}>
            Patient Address: {patient}
            <button onClick={() => history.push(`/doctor/data-viewer/${patient}`)}>
              View Records
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
