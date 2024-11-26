import React, { useEffect, useState } from 'react';
import { checkAccess, requestAccess } from '../../services/blockchain/contractService'; // Updated imports


const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]); // List of patients with access permissions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [message, setMessage] = useState('');

  // Mock list of patients - Replace this with real blockchain calls
  const mockPatients = [
    {
      address: '0x1234...abcd',
      name: 'John Doe',
      lastAccess: '2024-11-20',
    },
    {
      address: '0xabcd...1234',
      name: 'Jane Smith',
      lastAccess: '2024-11-18',
    },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);

        // Replace this mock data with real blockchain call
        // Example: const authorizedPatients = await getAuthorizedPatients();
        const authorizedPatients = mockPatients;

        setPatients(authorizedPatients);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleRequestAccess = async (patientAddress) => {
    try {
      setRequestingAccess(true);
      setMessage('');

      // Replace "purposeHash" with an actual purpose identifier
      const purposeHash = '0xabcdef...'; // Example: hash of "Medical Checkup"
      await requestAccess(patientAddress, purposeHash);

      setMessage(`Access requested for patient: ${patientAddress}`);
    } catch (err) {
      console.error('Error requesting access:', err);
      setMessage('Failed to request access.');
    } finally {
      setRequestingAccess(false);
    }
  };

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="doctor-dashboard">
      <h2>Doctor Dashboard</h2>
      {patients.length > 0 ? (
        <table className="patients-table">
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Address</th>
              <th>Last Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={index}>
                <td>{patient.name}</td>
                <td>{patient.address}</td>
                <td>{patient.lastAccess}</td>
                <td>
                  <button
                    onClick={() => handleRequestAccess(patient.address)}
                    disabled={requestingAccess}
                  >
                    {requestingAccess ? 'Requesting...' : 'Request Access'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No patients available.</p>
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default DoctorDashboard;
