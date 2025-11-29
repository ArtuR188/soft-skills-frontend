import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './CriticalThinking.css';

const CriticalThinkingResults = () => {
  const [data, setData] = useState({});
  const [dates, setDates] = useState([]);
  const [activeDate, setActiveDate] = useState('');
  const [characteristicTitles, setCharacteristicTitles] = useState({});
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const { state } = useLocation();

  const TEST_ID = "683335f246830d764b292356";

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("authToken");
      const stateFromLocalStorage = JSON.parse(localStorage.getItem("userState"));

      if (stateFromLocalStorage && stateFromLocalStorage.tests) {
        const filteredTests = stateFromLocalStorage.tests.filter(
          (test) => test.testId === TEST_ID
        );

        await fetchCharacteristicTitles(filteredTests);

        const formattedTests = {};
        filteredTests.forEach((test) => {
          if (test.results && test.results.characteristics) {
            const formattedTestData = test.results.characteristics.reduce((acc, curr) => {
              acc[curr.characteristicId] = curr.points;
              return acc;
            }, {});
            formattedTests[test.created_at] = formattedTestData;
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
        setHasFetched(true);
        setLoading(false);
      } else {
        await fetchResults(userId, token);
      }
    };

    loadData();
  }, [state]);

  const fetchResults = async (userId, token) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.statusText}`);
      }

      const userData = await response.json();
      const filteredTests = (userData.tests || []).filter(
        (test) => test.testId === TEST_ID
      );

      await fetchCharacteristicTitles(filteredTests);

      const formattedTests = {};
      filteredTests.forEach((test) => {
        if (test.results && test.results.characteristics) {
          const formattedTestData = test.results.characteristics.reduce((acc, curr) => {
            acc[curr.characteristicId] = curr.points;
            return acc;
          }, {});
          formattedTests[test.created_at] = formattedTestData;
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

      setHasFetched(true);
    } catch (error) {
      console.error("Error fetching Critical Thinking results:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacteristicTitles = async (tests) => {
    const token = localStorage.getItem("authToken");
    const titleMap = {};

    const allCharIds = tests
      .flatMap(test => test.results?.characteristics || [])
      .map(c => c.characteristicId);

    const uniqueCharIds = [...new Set(allCharIds)];

    for (const id of uniqueCharIds) {
      try {
        const res = await fetch(
          `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          titleMap[id] = data.title;
        }
      } catch (e) {
        console.error("Failed to fetch characteristic title for", id, e);
      }
    }

    setCharacteristicTitles(titleMap);
  };

  const getColor = (id) => {
    if (id === '6833313146830d764b2922cf') return '#0000FF';
    if (id === '6833313e46830d764b2922d1') return '#9999FF';
    return '#8884d8';
  };

  const pieData = activeDate && data[activeDate] && Object.keys(characteristicTitles).length > 0
    ? Object.entries(data[activeDate]).map(([id, value]) => ({
        id,
        name: characteristicTitles[id] || id,
        value,
      }))
    : [];

  const totalValue = pieData.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div className="results-container">
      <h2>Результати тесту:</h2>

      {loading ? null : pieData.length > 0 ? (
        <div className="results-layout">
          <div className="chart-wrapper" style={{ height: 400, minWidth: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={({ value }) => {
                    const percent = ((value / totalValue) * 100).toFixed(1);
                    return ` ${percent}%`;
                  }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={getColor(entry.id)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => {
                    const percent = ((value / totalValue) * 100).toFixed(1);
                    return [`${value} (${percent}%)`, 'Points'];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="date-section">
            <div className="date-scroll-container">
              {dates.map((date) => (
                <button
                  key={date}
                  className={`date-item ${date === activeDate ? 'active-date' : ''}`}
                  onClick={() => setActiveDate(date)}
                >
                  {new Date(date).toLocaleDateString()}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : hasFetched ? (
        <p>Щоб переглянути результати, спочатку потрібно пройти тест.</p>
      ) : null}
    </div>
  );
};

export default CriticalThinkingResults;
