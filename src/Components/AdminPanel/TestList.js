import { Card, Col, Row, Button, Toast } from "react-bootstrap";
import axios from "axios";
import React, { useState, useEffect } from "react";
import "./TestList.css";
import { Link } from "react-router-dom";

function TestList() {
  const [tests, setTests] = useState([]);
  const [showToast, setShowToast] = useState(false);
  
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }
    fetchTests(authToken);
  }, []);

  const fetchTests = async (authToken) => {
    try {
      const testsResponse = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setTests(testsResponse.data);
    } catch (error) {
      console.error("Error fetching tests:", error);
    }
  };

  const handleDeleteTest = async (testId) => {
    try {
      const authToken = localStorage.getItem("authToken");
      await axios.delete(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests/${testId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setTests(tests.filter((test) => test._id !== testId));
      setShowToast(true);
    } catch (error) {
      console.error("Error deleting test:", error);
    }
  };

  return (
    <>
      <div className="all_tests text-center">
        <h1>Тести</h1>
      </div>
      <Row xs={1} md={3} className="g-4">
        {tests.map((test, index) => (
          <Col key={index}>
            <Card style={{ height: "200px" }} className="flex a_testcard text-center">
              <Card.Body style={{ maxHeight: "60px" }}>
                <Card.Title>{test.title}</Card.Title>
              </Card.Body>
              <div className="d-flex justify-content-around pb-2">
                <Link to={`/test/${test._id}`} className="btn review-btn">Переглянути</Link>
                <Button variant="danger" onClick={() => handleDeleteTest(test._id)}>
                  Видалити
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
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
        <Toast.Header style={{ backgroundColor: "#ff7c7c", color: "white" }}>
          <strong className="me-auto">Тест видалено</strong>
        </Toast.Header>
        <Toast.Body>Тест видалено!</Toast.Body>
      </Toast>
    </>
  );
}

export default TestList;
