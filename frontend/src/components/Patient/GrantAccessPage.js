import React, { useEffect, useState } from 'react';
import { approveAccess, revokeAccess } from '../../services/blockchain/contractService'; // Updated imports


const GrantAccessPage = () => {
  const [accessRequests, setAccessRequests] = useState([]); // List of pending requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  // Mock pending access requests - Replace with blockchain integration
  const mockRequests = [
    {
      doctorAddress: '0x1234...abcd',
      name: 'Dr. John Doe',
      requestedData: 'Medical History',
    },
    {
      doctorAddress: '0xabcd...1234',
      name: 'Dr. Jane Smith',
      requestedData: 'Lab Results',
    },
  ];

  useEffect(() => {
    const fetchAccessRequests = async () => {
      try {
        setLoading(true);

        // Replace this mock data with blockchain call
        // Example: const requests = await fetchPendingAccessRequests(patientAddress);
        const requests = mockRequests;

        setAccessRequests(requests);
      } catch (err) {
        console.error('Error fetching access requests:', err);
        setError('Failed to load access requests.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccessRequests();
  }, []);

  const handleApprove = async (doctorAddress) => {
    try {
      setMessage('');
      await approveAccess(doctorAddress);
      setMessage(`Access approved for doctor: ${doctorAddress}`);

      // Remove the approved request from the list
      setAccessRequests((prev) =>
        prev.filter((request) => request.doctorAddress !== doctorAddress)
      );
    } catch (err) {
      console.error('Error approving access:', err);
      setMessage('Failed to approve access.');
    }
  };

  const handleRevoke = async (doctorAddress) => {
    try {
      setMessage('');
      await revokeAccess(doctorAddress);
      setMessage(`Access revoked for doctor: ${doctorAddress}`);

      // Remove the rejected request from the list
      setAccessRequests((prev) =>
        prev.filter((request) => request.doctorAddress !== doctorAddress)
      );
    } catch (err) {
      console.error('Error revoking access:', err);
      setMessage('Failed to revoke access.');
    }
  };

  if (loading) {
    return <p>Loading access requests...</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  return (
    <div className="grant-access-page">
      <h2>Grant Access</h2>
      {accessRequests.length > 0 ? (
        <table className="access-requests-table">
          <thead>
            <tr>
              <th>Doctor Name</th>
              <th>Address</th>
              <th>Requested Data</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessRequests.map((request, index) => (
              <tr key={index}>
                <td>{request.name}</td>
                <td>{request.doctorAddress}</td>
                <td>{request.requestedData}</td>
                <td>
                  <button
                    onClick={() => handleApprove(request.doctorAddress)}
                    className="approve-button"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRevoke(request.doctorAddress)}
                    className="revoke-button"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pending access requests.</p>
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default GrantAccessPage;
