import React, { useState, useEffect, useCallback } from 'react';
import './NotificationsPage.css';
import { useNotifications } from './NotificationsContext';
import { debounce } from "lodash";
import axios from 'axios';

const NotificationsPage = () => {
  const { notifications, error } = useNotifications();
  const [paginatedNotifications, setPaginatedNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [users, setUsers] = useState({});
  const notificationsPerPage = 10;

  const fetchUserWithRetry = async (userId, retries = 5, delayTime = 1000) => {
    const cachedUser = localStorage.getItem(`user_${userId}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem(`user_${userId}`, JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      if (retries > 0 && error.response?.status === 429) {
        await new Promise((resolve) => setTimeout(resolve, delayTime));
        return fetchUserWithRetry(userId, retries - 1, delayTime * 2);
      }
      return null;
    }
  };

  const fetchUsers = useCallback(
    debounce(async () => {
      const uniqueUserIds = [...new Set(notifications.map((n) => n.ownerId))];

      const usersData = await Promise.all(
        uniqueUserIds.map((id) =>
          users[id] ? Promise.resolve(users[id]) : fetchUserWithRetry(id)
        )
      );

      const usersMap = usersData.reduce((acc, user) => {
        if (user) {
          acc[user._id] = user;
        }
        return acc;
      }, {});

      setUsers((prevUsers) => ({
        ...prevUsers,
        ...usersMap,
      }));
    }, 1000),
    [notifications]
  );

  useEffect(() => {
    if (notifications.length > 0) {
      fetchUsers();
    }
  }, [notifications, fetchUsers]);

  const loadMoreNotifications = useCallback(async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);

    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.get(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/notifications/user-notifications`,
        {
          params: { pageNumber: currentPage, pageSize: notificationsPerPage },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const fetchedNotifications = response.data;

      if (fetchedNotifications.length > 0) {
        setPaginatedNotifications((prev) => {
          const newNotifications = fetchedNotifications.filter(
            (notif) => !prev.some((item) => item._id === notif._id)
          );
          const updatedNotifications = [...prev, ...newNotifications];
          localStorage.setItem('cachedNotifications', JSON.stringify(updatedNotifications));
          return updatedNotifications.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        });
        setCurrentPage((prev) => prev + 1);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch more notifications:', error);
    } finally {
      setIsFetching(false);
    }
  }, [currentPage, isFetching, hasMore]);

  useEffect(() => {
    loadMoreNotifications(); 
  }, []);

  return (
    <div className="notifications-page">
      <h1>Сповіщення</h1>
      {error && <div className="error">{error}</div>}

      {paginatedNotifications.length === 0 ? (
        <p className="no-notifications">Немає сповіщень</p>
      ) : (
        <div className="notifications-list">
          {paginatedNotifications.map((notification) => {
            const owner = users[notification.ownerId] || {};
            return (
              <div key={notification._id} className="notification-item">
                <div className="notification-header">
                  <div className="notification-author">
                    {owner.firstName} {owner.lastName || ''}
                  </div>
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-time">
                    {new Date(notification.created_at).toLocaleTimeString()} -{' '}
                    {new Date(notification.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="notification-body">
                  <p>{notification.meta?.description || 'Опис не було додано'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

     {hasMore && paginatedNotifications.length >= notificationsPerPage && (
  <button
    className="show-more-btn"
    onClick={loadMoreNotifications}
    disabled={isFetching}
  >
    {isFetching ? 'Завантаження...' : 'Завантажити ще'}
  </button>
)}
 
    </div>
  );
};

export default NotificationsPage;
