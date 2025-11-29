import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import "./Results.css";

const ResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const results = location.state?.results;
const [characteristicTitles, setCharacteristicTitles] = useState({});
  const [characteristics, setCharacteristics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
  let ignore = false;

  const latestTest = results?.tests.find(test => test.testId === id);
  const charData = latestTest?.results.characteristics || [];

  if (!results || !latestTest) {
    setError("No results found.");
    setLoading(false);
    return;
  }

  if (charData.length === 0) {
    setError("No characteristics found.");
    setLoading(false);
    return;
  }

  const fetchCharacteristics = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const characteristicsWithTitles = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (const [index, char] of charData.entries()) {
        if (index > 0) await delay(200);

        const response = await axios.get(
          `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics/${char.characteristicId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        characteristicsWithTitles.push({
          title: response.data.title,
          points: char.points,
        });
      }

      if (!ignore) {
        setCharacteristics(characteristicsWithTitles);
        setLoading(false);
      }
    } catch (e) {
      if (!ignore) {
        console.error("Error fetching characteristics:", e);
        setError("Failed to load characteristic details.");
        setLoading(false);
      }
    }
  };

  fetchCharacteristics();

  return () => {
    ignore = true; 
  };
}, [id, results]);


  if (loading) return <div className="loading">Завантаження...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="results-container">
      <h1 className="results-title">Результати Тесту</h1>
      {characteristics.length > 0 ? (
        <div className="results-list">
          {characteristics.map((char, index) => (
            <div className="results-card" key={index}>
              <h3 className="results-title-card">{char.title}</h3>
              <p className="results-points">{char.points} бали</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-results">Характеристики недоступні.</p>
      )}
    </div>
  );
};

export default ResultPage;
