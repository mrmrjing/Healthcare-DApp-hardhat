// components/Patient/GrantAccessPage.js
import React, { useEffect, useState } from 'react';
import { approveAccess, getAccessRequests } from '../../services/ContractService';

const GrantAccessPage = () => {
  const [accessRequests, setAccessRequests] = useState([]);

  useEffect(() => {
    const fetchAccessRequests = async () => {
      // Implement getAccessRequests to fetch pending requests
      const requests = await getAccessRequests();
      setAccessRequests(requests);
    };
    fetchAccessRequests();
  }, []);

  const handleApprove = async (providerAddress) => {
    await approveAccess(providerAddress);
    // Update the list of access requests
    setAccessRequests((prevRequests) =>
      prevRequests.filter((req) => req.provider !== providerAddress)
    );
  };

  return (
    <div>
      <h1>Grant Access</h1>
      {accessRequests.length > 0 ? (
        <ul>
          {accessRequests.map((request, index) => (
            <li key={index}>
              Provider: {request.provider}
              <button onClick={() => handleApprove(request.provider)}>
                Approve
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No pending access requests.</p>
      )}
    </div>
  );
};

export default GrantAccessPage;
