import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Carousel } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./UserTests.css";

export default function UserTests() {
  const [matchedData, setMatchedData] = useState({});
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url, options);
      } catch (error) {
        if (error.response?.status === 429 && i < retries - 1) {
          await new Promise(res => setTimeout(res, delay));
        } else {
          throw error;
        }
      }
    }
  };

  const fetchUserResults = useCallback(async () => {
    try {
      const userResultsResponse = await axios.get(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const userResults = userResultsResponse.data;
      console.log('User Results:', userResults);

      const characteristicsPromises = userResults.characteristics.map(async (char) => {
        try {
          const charResponse = await fetchWithRetry(
            `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics/${char.characteristicId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          return { ...char, details: charResponse.data };
        } catch (error) {
          console.error(`Error fetching characteristic ID ${char.characteristicId}:`, error);
          return null;
        }
      });

      const characteristicsDetails = await Promise.all(characteristicsPromises);
      const validCharacteristicsDetails = characteristicsDetails.filter(char => char !== null);

      const organizedData = validCharacteristicsDetails.reduce((acc, char) => {
        const softSkillType = char.details.softSkill.type;
        if (!acc[softSkillType]) {
          acc[softSkillType] = [];
        }
        acc[softSkillType].push({
          title: char.details.title,
          points: char.points,
        });
        return acc;
      }, {});

      setMatchedData(organizedData);
    } catch (error) {
      console.error("Error fetching user results or characteristics:", error);
    }
  }, [userId, token]);

  useEffect(() => {
    fetchUserResults();
  }, [fetchUserResults]);

  const chunkArray = (array, chunkSize) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  };

  return (
    <div className="main_wrapper">
      <div className="buttons-container">
        <button onClick={() => navigate(`/emotional-intelligence-results/${userId}`)}>
          Результати емоційного інтелекту
        </button>
        <button onClick={() => navigate(`/belbinresult/${userId}`)}>
          Результати тесту Белбіна
        </button>
         <button onClick={() => navigate(`/critical-thinking-results/${userId}`)}>
          Результати критичного мислення
        </button>
      </div>

      {Object.keys(matchedData).length === 0 ? (
        <div style={{ color: 'white' }}>No data available</div>
      ) : (
        Object.keys(matchedData).map((softSkill, index) => (
          <div className="test1" key={index}>
            <div className="test1_label">
              <label>{softSkill}</label>
            </div>

            <Carousel>
              {chunkArray(matchedData[softSkill], 4).map((chunk, chunkIndex) => (
                <Carousel.Item key={chunkIndex}>
                  <div className="test1_cards">
                    {chunk.map((char, charIndex) => (
                      <div className="test1_card1" key={charIndex}>
                        <p className="characteritiscs_title">{char.title}</p>
                        <p
                          style={{
                            backgroundColor: "rgb(225, 225, 225)",
                            borderRadius: "10px",
                            boxShadow:"black"
                          }}
                        >
                          {char.points}
                        </p>
                      </div>
                    ))}
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        ))
      )}
    </div>
  );
}
