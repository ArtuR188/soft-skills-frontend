import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {fetchUserNotifications} from '../../Redux/Actions/userActions'
import axios from 'axios';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (userId && token) {
      fetchUserNotifications(userId, token)
        .then((fetchedNotifications) => {
          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedNotifications.filter((n) => n.status !== 'unread').length);
        })
        .catch(() => {
          setError('Failed to fetch notifications.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  
 const markNotificationAsRead = useCallback(async (notificationIds) => {
  const token = localStorage.getItem('authToken');

  try {
    const requests = notificationIds.map(id =>
      axios.patch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/notifications/${id}`,
        { status: 'read' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    await Promise.all(requests);

    setNotifications((prev) =>
      prev.map((notification) =>
        notificationIds.includes(notification._id)
          ? { ...notification, status: 'read' }
          : notification
      )
    );

    setUnreadCount((prev) => Math.max(prev - notificationIds.length, 0));
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
  }
}, []);

  

  useEffect(() => {
    fetchNotifications();
  
    const eventSource = new EventSource(
      'http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/notifications/stream'
    );
  
    eventSource.onmessage = (event) => {
      const newNotification = JSON.parse(event.data);
  
      setNotifications((prev) => {
        const exists = prev.some((n) => n._id === newNotification._id);
        if (!exists) {
          const updated = [newNotification, ...prev];
          setUnreadCount(updated.filter((n) => n.status !== 'read').length);
          return updated;
        }
        return prev;
      });
    };
  
    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
      eventSource.close();
    };
  
    return () => {
      eventSource.close();
    };
  }, [fetchNotifications]);
  

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        error,
        loading,
        markNotificationAsRead, 
        fetchNotifications,
        setUnreadCount
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
