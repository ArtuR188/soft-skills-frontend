import { useLocation, Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import './EmotionalIntelligence.css';
import pLimit from 'p-limit';

const EmotionalIntelligenceResults = () => {
  const [data, setData] = useState({});
  const [dates, setDates] = useState([]);
  const [activeDate, setActiveDate] = useState('');
  const [overallScore, setOverallScore] = useState(0);
  const [level, setLevel] = useState('');
  const [characteristicTitles, setCharacteristicTitles] = useState({});
  const [hasResults, setHasResults] = useState(true);
  const { state } = useLocation();

  const TEST_ID = "681fbfd546830d764b291752";

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    const stateFromLocalStorage = JSON.parse(localStorage.getItem("userState"));

    if (stateFromLocalStorage && stateFromLocalStorage.tests) {
      const filteredTests = stateFromLocalStorage.tests.filter(
        (test) => test.testId === TEST_ID
      );

      if (filteredTests.length === 0) {
        setHasResults(false);
        return;
      }

      fetchCharacteristicTitles(filteredTests);

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
      setHasResults(true);
      if (sortedDates.length > 0) {
        setActiveDate(sortedDates[0]);
        calculateOverallScore(formattedTests[sortedDates[0]]);
      }
    } else {
      fetchResults(userId, token);
    }
  }, [state]);

  const fetchResults = async (userId, token) => {
    try {
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

      if (filteredTests.length === 0) {
        setHasResults(false);
        return;
      }

      fetchCharacteristicTitles(filteredTests);

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
      setHasResults(true);
      if (sortedDates.length > 0) {
        setActiveDate(sortedDates[0]);
        calculateOverallScore(formattedTests[sortedDates[0]]);
      }
    } catch (error) {
      console.error("Error fetching Emotional Intelligence results:", error);
    }
  };

  const fetchCharacteristicTitles = async (tests) => {
    const token = localStorage.getItem("authToken");

    const allCharIds = tests
      .flatMap(test => test.results?.characteristics || [])
      .map(c => c.characteristicId);

    const uniqueCharIds = [...new Set(allCharIds)];
    const alreadyFetched = new Set(Object.keys(characteristicTitles));
    const toFetchIds = uniqueCharIds.filter(id => !alreadyFetched.has(id));

    const limit = pLimit(3);
    const newTitleMap = { ...characteristicTitles };

    const promises = toFetchIds.map(id =>
      limit(async () => {
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
            newTitleMap[id] = data.title;
          }
        } catch (e) {
          console.warn("Error fetching", id, e);
        }
      })
    );

    await Promise.all(promises);
    setCharacteristicTitles(newTitleMap);
  };

  const calculateOverallScore = (testData) => {
    const scores = Object.values(testData);
    const totalScore = scores.reduce((acc, score) => acc + score, 0);
    const maxPossibleScore = scores.length * 18;
    const averageScore = (totalScore / maxPossibleScore) * 90;

    setOverallScore(averageScore.toFixed(0));

    if (averageScore >= 80) setLevel('Високий');
    else if (averageScore >= 60) setLevel('Середній');
    else setLevel('Низький');
  };

  const getLevel = (score) => {
    if (score >= 14) return 'Високий';
    if (score >= 9) return 'Середній';
    return 'Низький';
  };

  const formatTitle = (title) => {
    if (!title) return '';
    const words = title.split(' ');
    if (words.length > 2) {
      return `${words[0]}\n${words.slice(1).join(' ')}`;
    } else if (words.length === 2) {
      return `${words[0]}\n${words[1]}`;
    }
    return title;
  };

  return (
    <div className="results-container">
      <h2>Результати тесту на Емоційний інтелект</h2>

      {!hasResults ? (
        <div className="no-results">
          <p>Щоб переглянути результати, спершу пройдіть тест.</p>
        </div>
      ) : (
        <>
          <p>Результат: {overallScore}/90</p>
          <p>{level} рівень</p>

          {activeDate && data[activeDate] && (
            <div className="results-layout">
              <div className="radar-chart-wrapper">
                <h3>Графік результатів:</h3>
                <div style={{ width: "100%", height: 400 }}>
                  <ResponsiveContainer>
                    <RadarChart
                      data={Object.entries(data[activeDate]).map(([id, value]) => ({
                        characteristic: formatTitle(characteristicTitles[id] || id),
                        value: value,
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="characteristic"
                        tick={({ payload, x, y, textAnchor }) => (
                          <text
                            x={x}
                            y={y}
                            textAnchor={textAnchor}
                            fill="#666"
                            fontSize={14}
                          >
                            {payload.value.split('\n').map((line, index) => (
                              <tspan key={index} x={x} dy={index === 0 ? 0 : 14}>
                                {line}
                              </tspan>
                            ))}
                          </text>
                        )}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 18]} />
                      <Radar
                        name="EI Score"
                        dataKey="value"
                        stroke="#84aefc"
                        fill="#84aefc"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="date-section">
                <div className="date-scroll-container">
                  {dates.map((date) => (
                    <button
                      key={date}
                      className={`date-item ${date === activeDate ? "active-date" : ""}`}
                      onClick={() => {
                        setActiveDate(date);
                        calculateOverallScore(data[date]);
                      }}
                    >
                      {new Date(date).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="characteristics-table">
                <h3>Таблиця результатів:</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Характеристика</th>
                      <th>Оцінка</th>
                      <th>Рівень</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(data[activeDate]).map(([id, score]) => (
                      <tr key={id}>
                        <td>{characteristicTitles[id] || id}</td>
                        <td>{score}</td>
                        <td>{getLevel(score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmotionalIntelligenceResults;
