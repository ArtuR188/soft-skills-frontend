import axios from 'axios';

const API_URL = "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com";

export const loginUser = (formData) => async (dispatch) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/signin`,
      formData
    );

    if (response.data && response.data.token) {
      localStorage.removeItem('cachedUserInfo');
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('userId', response.data._id);

      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      return response.data;
    } else {
      throw new Error('Помилка авторизації.');
    }
  } catch (error) {
    dispatch({
      type: 'LOGIN_FAIL',
      payload: error.message || 'Помилка авторизації.',
    });
    throw error;
  }
};


const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  try {
    return await axios.get(url, options);
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const fetchUserNotifications = async () => {
  const token = localStorage.getItem("authToken");

  if (!token) throw new Error("User is not authenticated");

  try {
    const response = await fetchWithRetry(
      `${API_URL}/notifications/user-notifications`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch notifications");
  }
};


export const registerUser = (formData) => async (dispatch) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/signup`,
      formData
    );
    dispatch({ type: 'REGISTER_SUCCESS', payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({
      type: 'REGISTER_FAIL',
      payload: error.message || error.response?.data?.message,
    });
    throw error;
  }
};


export const getUserInfo = () => async (dispatch) => {
  try {
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      throw new Error("User is not authenticated");
    }

    const cachedUserInfo = localStorage.getItem('cachedUserInfo');
    if (cachedUserInfo) {
      dispatch({ type: 'FETCH_USER_SUCCESS', payload: JSON.parse(cachedUserInfo) });
      return;
    }

    const response = await axios.get(
      `${API_URL}/users/${userId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    localStorage.setItem('cachedUserInfo', JSON.stringify(response.data));
    dispatch({ type: 'FETCH_USER_SUCCESS', payload: response.data });
  } catch (error) {
    dispatch({ type: 'FETCH_USER_FAIL', payload: error.message });
  }
};


export const logout = () => (dispatch) => {
  localStorage.removeItem("userId");
  localStorage.removeItem("authToken");
  document.location.href = "/login";
};
