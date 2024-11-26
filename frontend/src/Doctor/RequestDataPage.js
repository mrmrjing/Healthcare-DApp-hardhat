// components/Doctor/RequestDataPage.js
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { requestAccess } from '../../services/ContractService';

const RequestDataPage = () => {
  const [patientAddress, setPatientAddress] = useState('');
  const [purpose, setPurpose] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const purposeHash = ethers.utils.id(purpose);
    await requestAccess(patientAddress, purposeHash);
    alert('Access request sent to patient.');
  };

  return (
    <div>
      <h1>Request Data from Patient</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Patient Address:
          <input
            type="text"
            value={patientAddress}
            onChange={(e) => setPatientAddress(e.target.value)}
          />
        </label>
        <br />
        <label>
          Purpose of Access:
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </label>
        <br />
        <button type="submit">Request Access</button>
      </form>
    </div>
  );
};

export default RequestDataPage;
