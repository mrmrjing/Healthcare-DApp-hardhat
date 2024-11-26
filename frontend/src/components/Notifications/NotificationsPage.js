// components/Notifications/NotificationsPage.js
import React, { useEffect, useState } from 'react';
import { getNotifications } from '../../services/blockchain/contractService';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      // Implement getNotifications in ContractService.js
      const notifs = await getNotifications();
      setNotifications(notifs);
    };
    fetchNotifications();
  }, []);

  return (
    <div>
      <h1>Notifications</h1>
      {notifications.length > 0 ? (
        <ul>
          {notifications.map((notif, index) => (
            <li key={index}>
              {notif.message} - {notif.date}
            </li>
          ))}
        </ul>
      ) : (
        <p>No new notifications.</p>
      )}
    </div>
  );
};

export default NotificationsPage;
