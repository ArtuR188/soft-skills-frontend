import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./BelbinGraphicResult.css";
import "./BelbinResult.css";
import roleInfo from "./roles_info.json";
import Feedback from "../Feedbacks/FeedbackComponent";

const roleTranslation = {
  implementer: "Реалізатор",
  coordinator: "Координатор",
  creator: "Творець",
  generatorOfIdeas: "Генератор ідей",
  researcher: "Дослідник",
  expert: "Експерт",
  specialist: "Спеціаліст",
  diplomat: "Дипломат"
};

const BelbinResultPage = () => {
  const { userId } = useParams();
  const { state } = useLocation();
  const [data, setData] = useState(null);
  const [dates, setDates] = useState([]);
  const [activeDate, setActiveDate] = useState("");
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [hasResults, setHasResults] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (state && state.tests) {
      const belbinTests = state.tests.filter((test) => test.type === "belbin");

      if (belbinTests.length === 0) {
        setHasResults(false);
        return;
      }

      const formattedTests = {};

      belbinTests.forEach((test) => {
        if (Array.isArray(test.results)) {
          formattedTests[test.created_at] = test.results.reduce((acc, curr) => {
            acc[curr.role] = curr.value;
            return acc;
          }, {});
        }
      });

      const sortedDates = Object.keys(formattedTests).sort(
        (a, b) => new Date(b) - new Date(a)
      );

      setData(formattedTests);
      setDates(sortedDates);
      if (sortedDates.length > 0) {
        setActiveDate(sortedDates[0]);
      }
    } else {
      fetchResults(userId, token);
    }
  }, [state, userId]);

  const fetchResults = async (userId, token) => {
    try {
      const response = await fetch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.statusText}`);
      }

      const userData = await response.json();

      if (userData && userData.tests) {
        const belbinTests = userData.tests.filter(
          (test) => test.type === "belbin"
        );

        if (belbinTests.length === 0) {
          setHasResults(false);
          return;
        }

        const formattedTests = {};

        belbinTests.forEach((test) => {
          const resultsArray = Array.isArray(test.results)
            ? test.results
            : Object.entries(test.results).map(([role, value]) => ({
                role,
                value
              }));

          formattedTests[test.created_at] = resultsArray.reduce((acc, curr) => {
            acc[curr.role] = curr.value;
            return acc;
          }, {});
        });

        const sortedDates = Object.keys(formattedTests).sort(
          (a, b) => new Date(b) - new Date(a)
        );

        setData(formattedTests);
        setDates(sortedDates);
        if (sortedDates.length > 0) {
          setActiveDate(sortedDates[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  if (!hasResults) {
    return (
      <div className="no-results-message">
        <p>Ви ще не проходили тест Белбіна. Будь ласка, пройдіть тест, щоб побачити результати.</p>
      </div>
    );
  }

  if (!data || dates.length === 0) {
    return <p>Завантаження...</p>;
  }

  const formattedData = Object.entries(data[activeDate] || {}).map(
    ([role, score]) => ({
      role,
      score
    })
  );

  const sortedData = [...formattedData].sort((a, b) => b.score - a.score);
  const topRoles = sortedData.slice(0, 3);

  return (
    <div className="chart-container">
      <div className="chart-section">
        <h2 className="chart-title">Результати Тесту Белбіна</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={formattedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="role"
              tickFormatter={(value) => roleTranslation[value] || value}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => value}
              labelFormatter={(label) => roleTranslation[label] || label}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#0000FF"
              activeDot={{ r: 8 }}
              dot={({ cx, cy, payload }) =>
                topRoles.some((item) => item.role === payload.role) ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#FDB7EA"
                    stroke="#0000FF"
                    strokeWidth={1}
                  />
                ) : (
                  <circle cx={cx} cy={cy} r={5} fill="#2a2aff" />
                )
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="date-section">
        <div className="date-scroll-container">
          {dates.map((date) => (
            <button
              key={date}
              className={`date-item ${date === activeDate ? "active-date" : ""}`}
              onClick={() => setActiveDate(date)}
            >
              {new Date(date).toLocaleDateString()}
            </button>
          ))}
        </div>
      </div>

      <div className="role-info-section">
        <h3>Ваші три основні ролі в команді: </h3>

        <div className="role-info-table desktop-only">
          <table>
            <thead>
              <tr>
                <th>Роль</th>
                <th>Можлива позиція</th>
                <th>Характеристики</th>
                <th>Роль у команді</th>
                <th>Слабкості</th>
              </tr>
            </thead>
            <tbody>
              {topRoles.map((role) => (
                <tr key={role.role}>
                  <td>{roleTranslation[role.role] || role.role}</td>
                  <td>{roleInfo[role.role]?.possible_position}</td>
                  <td>{roleInfo[role.role]?.personal_characteristics}</td>
                  <td>{roleInfo[role.role]?.team_role}</td>
                  <td>{roleInfo[role.role]?.weaknesses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-only role-switcher">
          <div className="role-buttons">
            {topRoles.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedRoleIndex(index)}
                className={selectedRoleIndex === index ? "active" : ""}
              >
                Роль {index + 1}
              </button>
            ))}
          </div>

          <div className="role-card">
            <p>
              <strong>Роль:</strong>{" "}
              {roleTranslation[topRoles[selectedRoleIndex].role] ||
                topRoles[selectedRoleIndex].role}
            </p>
            <p>
              <strong>Можлива позиція:</strong>{" "}
              {roleInfo[topRoles[selectedRoleIndex].role]?.possible_position}
            </p>
            <p>
              <strong>Характеристики:</strong>{" "}
              {roleInfo[topRoles[selectedRoleIndex].role]?.personal_characteristics}
            </p>
            <p>
              <strong>Роль у команді:</strong>{" "}
              {roleInfo[topRoles[selectedRoleIndex].role]?.team_role}
            </p>
            <p>
              <strong>Слабкості:</strong>{" "}
              {roleInfo[topRoles[selectedRoleIndex].role]?.weaknesses}
            </p>
          </div>
        </div>
      </div>

      <div className="expandable-role-section">
        {topRoles.map((role, index) => (
          <details key={index} className="role-details">
            <summary className="role-summary">
              {roleTranslation[role.role]?.toUpperCase() || role.role.toUpperCase()}
            </summary>
            <div className="role-description">
              <p>
                <strong>Характеристика:</strong>{" "}
                {roleInfo[role.role]?.characteristic}
              </p>
              <p>
                <strong>Функціональність:</strong>{" "}
                {roleInfo[role.role]?.functionality}
              </p>
            </div>
          </details>
        ))}
      </div>

      <Feedback />
    </div>
  );
};

export default BelbinResultPage;
