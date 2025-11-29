import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from "react-router";
import axios from "axios";
import YesNoCard from "../Components/CurrentTest/YesNoCard";
import MultipleChoiceCard from "../Components/CurrentTest/MultipleChoiceCard";
import SliderCard from "../Components/CurrentTest/SliderCard";
import RadioCard from "../Components/CurrentTest/RadioCard";
import { useNavigate } from 'react-router-dom';
import Toast from 'react-bootstrap/Toast';

const TestPage = () => {
  const { id } = useParams();
  const [test, setTest] = useState({});
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [showCompletionToast, setShowCompletionToast] = useState(false);
  const [remainingTime, setRemainingTime] = useState(null);
  const navigate = useNavigate();

  const getCurrentTest = useCallback(async (authToken) => {
    try {
      const testResp = await axios.get(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests/${id}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setTest(testResp.data);
      setQuestions(testResp.data.questions);
      
      if (testResp.data.timer) {
        setRemainingTime(testResp.data.timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }
    getCurrentTest(authToken);
  }, [id, getCurrentTest]);

  useEffect(() => {
    if (remainingTime === null) return;

    const timerInterval = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerInterval);
          handleSubmit(); 
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [remainingTime]);

  const handleAnswerChange = (questionId, selectedIndices) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedIndices
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!authToken) {
        console.error("Auth token is not available.");
        return;
    }

    if (!userId) {
        console.error("UserId is not available.");
        return;
    }

    const formattedAnswers = questions.map((question) => {
        const selectedAnswer = answers[question._id];

        if (selectedAnswer && selectedAnswer.length > 0) {
            return {
                questionId: question._id,
                answers: selectedAnswer,
            };
        }

        console.warn(`Question ${question._id} has no valid answer.`);
        return null;
    }).filter(Boolean);

    if (formattedAnswers.length === 0) {
        console.error("No valid answers selected.");
        return;
    }

    const url = `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${userId}/tests/${id}/results`;

   try {
    const response = await axios.post(url, formattedAnswers, {
        headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
        },
    });

    console.log('Response:', response.data);
    setShowCompletionToast(true);

    if (id === '681fbfd546830d764b291752') {
        navigate(`/emotional-intelligence-results/${id}`, { state: { results: response.data } });
    } else if (id === '683335f246830d764b292356') {
        navigate(`/critical-thinking-results/${id}`, { state: { results: response.data } });
    } else {
        navigate(`/results/${id}`, { state: { results: response.data } });
    }
} catch (e) {
    console.error('Error submitting results', e.response ? e.response.data : e.message);
    alert('There was an error submitting your results. Please try again later.');
}
};


  useEffect(() => {
    if (showCompletionToast) {
      const timer = setTimeout(() => {
        navigate('/profile');
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [showCompletionToast, navigate]);

  return (
    <div>
      <div className="main-content">
        <h1 className="test_name">{test.title}</h1>

        {remainingTime !== null && (
          <div className="timer">
            Time Remaining: {Math.floor(remainingTime / 60)}:{remainingTime % 60 < 10 ? '0' : ''}{remainingTime % 60}
          </div>
        )}

        <div className="item-list1" style={{ overflow: "unset", width:"100%"}}>
        {questions.map((question, index) => (
  <div key={question._id} style={{ marginTop: '20px' }} className="question-item">
    {question.type === "yes_no" && (
      <YesNoCard number={index + 1} question={question} onAnswerChange={handleAnswerChange} />
    )}
    {question.type === "multiple_choice" && (
      <MultipleChoiceCard number={index + 1} question={question} onAnswerChange={handleAnswerChange} />
    )}
    {question.type === "slider" && (
      <SliderCard
        number={index + 1}
        question={{
          ...question,
          sliderMin: Math.min(...question.answers.map(Number)),
          sliderMax: Math.max(...question.answers.map(Number)),
        }}
        onAnswerChange={handleAnswerChange}
      />
    )}
    {question.type === "radio" && (
      <RadioCard number={index + 1} question={question} onAnswerChange={handleAnswerChange} />
    )}
  </div>
))}
        </div>

        <Toast
          onClose={() => setShowCompletionToast(false)}
          show={showCompletionToast}
          delay={3000}
          autohide
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 1000,
            backgroundColor: "#c2323",
          }}
        >
          <Toast.Header style={{ backgroundColor: "green", color: "white" }}>
            <strong className="me-auto">Test Completed</strong>
          </Toast.Header>
          <Toast.Body>Test was successfully completed!</Toast.Body>
        </Toast>
      </div>

      <div className="d-flex justify-content-center">
        <button style={{ marginTop: '20px' }} className="create_test" onClick={handleSubmit}>
          Complete Test
        </button>
      </div>
    </div>
  );
};

export default TestPage;
