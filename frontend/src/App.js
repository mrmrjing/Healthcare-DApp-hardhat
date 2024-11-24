// import React from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import LandingPage from './pages/LandingPage';
// import PatientDashboardPage from './pages/PatientDashboardPage';
// import DoctorDashboardPage from './pages/DoctorDashboardPage';
// import GrantAccessPage from './pages/GrantAccessPage';
// import RequestDataPage from './pages/RequestDataPage';
// import DataAccessViewerPage from './pages/DataAccessViewerPage';
// import AccessHistoryPage from './pages/AccessHistoryPage';
// import NotificationsPage from './pages/NotificationsPage';
// import SettingsPage from './pages/SettingsPage';
// import { AuthContext } from './contexts/AuthContext';

// function App() {
//   const { authState } = React.useContext(AuthContext);

//   return (
//     <Router>
//       <Routes>
//         {/* Landing page route */}
//         <Route path="/" element={<LandingPage />} />
        
//         {/* Routes for authenticated patients */}
//         {authState.isAuthenticated && authState.userRole === 'patient' && (
//           <>
//             <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
//             <Route path="/patient/grant-access" element={<GrantAccessPage />} />
//             <Route path="/patient/access-history" element={<AccessHistoryPage />} />
//           </>
//         )}

//         {/* Routes for authenticated doctors */}
//         {authState.isAuthenticated && authState.userRole === 'doctor' && (
//           <>
//             <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
//             <Route path="/doctor/request-data" element={<RequestDataPage />} />
//             <Route path="/doctor/data-viewer" element={<DataAccessViewerPage />} />
//           </>
//         )}

//         {/* Routes for other sections */}
//         {authState.isAuthenticated && (
//           <>
//             <Route path="/notifications" element={<NotificationsPage />} />
//             <Route path="/settings" element={<SettingsPage />} />
//           </>
//         )}

//         {/* Redirect to landing page if route not found */}
//         <Route path="*" element={<Navigate to="/" />} />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page route */}
        <Route path="/" element={<LandingPage />} />
        
        
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
