import React, { useState, useEffect } from "react";
import "./AdminNotifications.css";

const NotificationForm = () => {
  const [users, setUsers] = useState([]);
  const [addedUsers, setAddedUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [tests, setTests] = useState([]);
  const [formData, setFormData] = useState({
    type: "testInvitation",
    nameOrArticle: "",
    dateOfEvent: "",
    role: "Web-Programming",
    selectedTest: "",
    additionalDescription: "",
    picture: null,
  });
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem("authToken");
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setError("No token found. Please log in.");
      return;
    }

    fetch("http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          throw new Error("Unexpected API response for users");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load users");
      });

    fetch("http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch tests");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTests(data);
        } else {
          throw new Error("Unexpected API response for tests");
        }
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to load tests");
      });
  }, []);

  const handleAddUser = (user) => {
    if (!addedUsers.some((u) => u._id === user._id)) {
      setAddedUsers((prevUsers) => [...prevUsers, user]);
    }
  };

  const handleRemoveUser = (user) => {
    setAddedUsers((prevUsers) => prevUsers.filter((u) => u._id !== user._id));
  };

  const handleClearForm = () => {
    setFormData({
      type: "testInvitation",
      nameOrArticle: "",
      dateOfEvent: "",
      role: "Web-Programming",
      selectedTest: "",
      additionalDescription: "",
      picture: null,
    });
    setSearch("");
    setAddedUsers([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendNotification = () => {
    const token = getToken();

    if (!formData.nameOrArticle) {
      setError("Title is required.");
      return;
    }

    if (addedUsers.length === 0) {
      setError("At least one recipient must be added.");
      return;
    }

    let apiData;

    if (formData.type === "testInvitation") {
      if (!formData.selectedTest) {
        setError("Please select a test for the invitation.");
        return;
      }
      const testLink = `/test/${formData.selectedTest}`;
      apiData = {
        studentIds: addedUsers.map((user) => user._id),
        type: "testInvitation",
        title: formData.nameOrArticle,
        meta: {
          dueDate: formData.dateOfEvent,
          testId: formData.selectedTest,
          message: `${formData.additionalDescription || "No additional message provided."}\n\nTest Link: ${testLink}`,
        },
      };
    } else {
      apiData = {
        studentIds: addedUsers.map((user) => user._id),
        title: formData.nameOrArticle,
        type: "event",
        meta: {
          date: formData.dateOfEvent,
          role: formData.role,
          description: formData.additionalDescription || "No description provided.",
          shortDescription: formData.nameOrArticle,
        },
      };
    }

    fetch("http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(apiData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message || "Failed to send notification");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log("Notification sent successfully:", data);
        handleClearForm();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || "Failed to send notification due to a network error.");
      });
  };

  return (
    <div className="notification-form">
      <h1>Створити сповіщення</h1>
      <div className="main-info">
        <div className="form-group">
          <label>Тип:</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <option value="testInvitation">Запрошення на тест</option>
            <option value="event">Оголошення події</option>
          </select>
        </div>

        <div className="form-group">
          <label>Назва</label>
          <input
            type="text"
            name="nameOrArticle"
            placeholder="Введіть назву або статтю"
            value={formData.nameOrArticle}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label>{formData.type === "testInvitation" ? "Кінцева дата:" : "Дата події:"}</label>
          <input
            type="datetime-local"
            name="dateOfEvent"
            value={formData.dateOfEvent}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Одержувачі:</label>
        <input
          type="text"
          placeholder="Пошук за ім’ям"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="recipients">
        <div className="user-list-row">
          <h3>Користувачі:</h3>
          <div className="user-list">
            {error ? (
              <div className="error">{error}</div>
            ) : users.length === 0 ? (
              <div>Завантаження користувачів...</div>
            ) : (
              users
                .filter(
                  (user) =>
                    !addedUsers.some((addedUser) => addedUser._id === user._id) &&
                    `${user.firstName} ${user.lastName}`
                      .toLowerCase()
                      .includes(search.toLowerCase())
                )
                .map((user) => (
                  <div key={user._id} className="user-item">
                    {user.firstName} {user.lastName}
                    <button onClick={() => handleAddUser(user)}>Додати</button>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="added-users-row">
          <h3>Додані користувачі:</h3>
          <div className="added-users-list">
            {addedUsers.length > 0 ? (
              addedUsers.map((user) => (
                <div key={user._id} className="added-user">
                  {user.firstName} {user.lastName}
                  <button onClick={() => handleRemoveUser(user)}>X</button>
                </div>
              ))
            ) : (
              <p>Користувачі ще не додані.</p>
            )}
          </div>
        </div>
      </div>

      {formData.type === "testInvitation" ? (
        <div className="form-group">
          <label>Оберіть тест:</label>
          {tests.length === 0 ? (
            <p>Завантаження тестів...</p>
          ) : (
            <select
              name="selectedTest"
              value={formData.selectedTest}
              onChange={handleInputChange}
            >
              <option value="">Оберіть тест</option>
              {tests
                .filter(
                  (test) => typeof test.title === "string" && test.title.trim() !== ""
                )
                .map((test) => (
                  <option key={test._id} value={test._id}>
                    {test.title}
                  </option>
                ))}
            </select>
          )}
        </div>
      ) : (
        <div className="form-group">
          <label>Додатковий опис:</label>
          <textarea
            name="additionalDescription"
            rows="5"
            value={formData.additionalDescription}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div className="form-actions">
        <button onClick={handleClearForm}>Очистити</button>
        <button onClick={handleSendNotification}>Надіслати</button>
      </div>
    </div>
  );
};

export default NotificationForm;
