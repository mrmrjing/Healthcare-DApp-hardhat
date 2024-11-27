import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

// Dummy data for demonstration
const mockAccessLogs = [
  { id: 1, date: '2024-11-20', action: 'Granted access to Dr. Smith' },
  { id: 2, date: '2024-11-18', action: 'Revoked access from General Hospital' },
  { id: 3, date: '2024-11-15', action: 'Accessed by Dr. Lee' },
];

const mockPermissions = [
  { id: 1, name: 'Dr. Smith', type: 'Doctor', access: true },
  { id: 2, name: 'General Hospital', type: 'Facility', access: false },
  { id: 3, name: 'Dr. Lee', type: 'Doctor', access: true },
];

const PatientDashboard = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [accessLogs, setAccessLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    // Simulate fetching data
    setAccessLogs(mockAccessLogs);
    setPermissions(mockPermissions);
  }, []);

  const togglePermission = (id) => {
    setPermissions((prevPermissions) =>
      prevPermissions.map((perm) =>
        perm.id === id ? { ...perm, access: !perm.access } : perm
      )
    );
  };

  const handleLogout = () => {
    logout(); // Clear authentication state
    localStorage.removeItem('walletAddress'); // Clear stored wallet address if applicable
    navigate('/'); // Redirect to the landing page
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Logout Button */}
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Log Out
        </button>
      </div>

      {/* Dashboard Header */}
      <h1>Patient Dashboard</h1>

      {/* Recent Access Logs Section */}
      <section style={{ marginBottom: '20px' }}>
        <h2>Recent Access Logs</h2>
        <ul>
          {accessLogs.map((log) => (
            <li key={log.id}>
              {log.date}: {log.action}
            </li>
          ))}
        </ul>
      </section>

      {/* Manage Permissions Section */}
      <section>
        <h2>Manage Permissions</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>Name</th>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>Type</th>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>Access</th>
              <th style={{ border: '1px solid #ccc', padding: '10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>{perm.name}</td>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>{perm.type}</td>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                  {perm.access ? 'Granted' : 'Revoked'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '10px' }}>
                  <button onClick={() => togglePermission(perm.id)}>
                    {perm.access ? 'Revoke' : 'Grant'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default PatientDashboard;
