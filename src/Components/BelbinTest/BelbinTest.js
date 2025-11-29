import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BelbinTest.css";

const API_URL = "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com";

const BelbinTest = () => {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const navigate = useNavigate();

  const getToken = () => {
    return localStorage.getItem("authToken"); 
  };

  useEffect(() => {
    const token = getToken(); 

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTest = async () => {
      try {
        const response = await fetch(API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch test: ${response.statusText}`);
        }

        const data = await response.json();
        setTest(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();

    const handleResize = () => setIsSmallScreen(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [navigate]);

  const handleChangePoints = (questionIndex, subQuestionIndex, value) => {
    if (!test) return;
  
    const updatedQuestions = [...test.questions];
    const updatedSubQuestions = [...updatedQuestions[questionIndex].subQuestions];
  
    const scoredSubQuestions = updatedSubQuestions.filter(sq => sq.points !== undefined).length;
  
    if (scoredSubQuestions >= 4 && value !== 0 && updatedSubQuestions[subQuestionIndex].points === undefined) {
      return;
    }
  
    const previousValue = updatedSubQuestions[subQuestionIndex].points || 0;
  
    const currentTotal = updatedQuestions[questionIndex].subQuestions.reduce((sum, sq) => sum + (sq.points || 0), 0);
  
    if (currentTotal - previousValue + value > 10) {
      return; 
    }
  
    updatedSubQuestions[subQuestionIndex].points = value === previousValue ? undefined : value;
    updatedQuestions[questionIndex].subQuestions = updatedSubQuestions;
  
    setTest({
      ...test,
      questions: updatedQuestions,
    });
  };
  
  
  const handleSubmit = async () => {
    const token = getToken();
    const userId = localStorage.getItem("userId");
  
    if (!token || !userId) {
      navigate("/login");
      return;
    }
  
    const requestBody = test.questions.map((q) => ({
      questionId: q._id,
      answers: q.subQuestions.map((sq) => ({
        role: sq.role,
        value: sq.points || 0,
      })),
    }));
  
    console.log("Submitting test results:", JSON.stringify(requestBody, null, 2));
  
    try {
      const response = await fetch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}/tests/belbin/results`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );
  
      if (!response.ok) {
        throw new Error("Failed to submit test results.");
      }
  
      console.log("Test submitted successfully!");
  
      const resultData = await response.json();
  
      const rolesWithPoints = requestBody.flatMap((q) =>
        q.answers.map((sq) => ({
          role: sq.role,
          points: sq.value,
        }))
      );
  
      const rolePointsMap = rolesWithPoints.reduce((acc, { role, points }) => {
        acc[role] = (acc[role] || 0) + points;
        return acc;
      }, {});
  
      const sortedRoles = Object.entries(rolePointsMap)
        .sort(([, pointsA], [, pointsB]) => pointsB - pointsA)
        .slice(0, 3); 
  
      const topRoles = sortedRoles.map(([role]) => role);
  
      navigate(`/belbinresult/${userId}`, { state: { results: resultData.results, topRoles } });
  
    } catch (error) {
      console.error("Submission Error:", error);
    }
  };
  
  
  const handleNext = () => {
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateTotalPoints = (questionIndex) => {
    const question = test.questions[questionIndex];
    return question.subQuestions.reduce((sum, sq) => sum + (sq.points || 0), 0);
  };

  const calculateAllTotalPoints = () => {
    return test.questions.reduce((sum, question) => sum + calculateTotalPoints(test.questions.indexOf(question)), 0);
  };

  if (loading) return <div>Loading test...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="test-container">
      <h1>{test.title || "Test Title"}</h1>
      <p>Створено: {test.created_by || "Unknown"}</p>

      {test.questions && test.questions.length > 0 ? (
        isSmallScreen ? (
          <div className="mobile-navigation">
            <button
              className="nav-button"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              ← Попередня
            </button>
            <div className="question-block">
              <h3>{test.questions[currentQuestionIndex].question || `Question ${currentQuestionIndex + 1}`}</h3>
              {test.questions[currentQuestionIndex].subQuestions.map((subQuestion, subIndex) => {
                const previousValue = subQuestion.points || 0;
                const remainingPoints = 10 - test.questions[currentQuestionIndex].subQuestions.reduce((sum, sq) => sum + (sq.points || 0), 0) + previousValue;

                return (
                  <div className="sub-question" key={subIndex}>
                    <p>{subQuestion.text || `Sub-question ${subIndex + 1}`}</p>
                    <div className="point-input">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                        const isSelected = subQuestion.points === num;
                        const isDisabled = num > remainingPoints;

                        return (
                          <button
                            key={num}
                            className={`point-button ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (!isDisabled) handleChangePoints(currentQuestionIndex, subIndex, num);
                            }}
                            style={isDisabled ? { pointerEvents: "none", opacity: 0.5 } : {}}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <p>Загальні бали: {calculateTotalPoints(currentQuestionIndex)} / 10</p>
            </div>
            <button
              className="nav-button"
              onClick={handleNext}
              disabled={currentQuestionIndex === test.questions.length - 1}
            >
              Наступна →
            </button>
          </div>
        ) : (
          <div className="questions-column">
            {test.questions.map((question, index) => {
              const totalPoints = calculateTotalPoints(index);

              return (
                <div className="question-block" key={index}>
                  <h3>{question.question || `Question ${index + 1}`}</h3>
                  {question.subQuestions.map((subQuestion, subIndex) => {                
                    return (
                      <div className="sub-question" key={subIndex}>
                        <p>{subQuestion.text || `Sub-question ${subIndex + 1}`}</p>
                        <div className="point-input">
                          <input
                            type="number"
                            value={subQuestion.points || 0}
                            min="0"
                            max="10"
                            onChange={(e) =>
                              handleChangePoints(index, subIndex, parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p>Загальні бали: {totalPoints} / 10</p>
                </div>
              );
            })}

            <div className="total-points">
              <h3>Бали за всі блоки питань: {calculateAllTotalPoints()} / {test.questions.length * 10}</h3>
            </div>
          </div>
        )
      ) : (
        <p>Питання недоступні.</p>
      )}

<button className="submit-button" onClick={handleSubmit}>
  Завершити
</button>

    </div>
  );
};

export default BelbinTest;
