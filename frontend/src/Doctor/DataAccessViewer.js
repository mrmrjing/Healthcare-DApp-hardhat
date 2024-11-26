// components/Doctor/DataAccessViewer.js
import React, { useEffect, useState } from 'react';
import { getPatientRecords } from '../../services/blockchain/contractService';

const DataAccessViewer = ({ patientAddress }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);

  useEffect(() => {
    const fetchRecords = async () => {
      const records = await getPatientRecords(patientAddress);
      setMedicalRecords(records);
    };
    fetchRecords();
  }, [patientAddress]);

  return (
    <div>
      <h1>Medical Records for {patientAddress}</h1>
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

export default DataAccessViewer;
