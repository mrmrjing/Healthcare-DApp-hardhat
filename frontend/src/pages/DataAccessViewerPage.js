// pages/DataAccessViewerPage.js
import React from 'react';
import DataAccessViewer from '../components/Doctor/DataAccessViewer';
import { useParams } from 'react-router-dom';

const DataAccessViewerPage = () => {
  const { patientAddress } = useParams();

  return (
    <div>
      <DataAccessViewer patientAddress={patientAddress} />
    </div>
  );
};

export default DataAccessViewerPage;
