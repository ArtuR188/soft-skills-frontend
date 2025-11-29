import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { getUserInfo } from "../../Redux/Actions/userActions.js";
import FirstTestImage from "../../Assets/Images/FirstTestImage.svg";
import SecondTestImage from "../../Assets/Images/SecondTestImage.svg";
import ThirdTestImage from "../../Assets/Images/ThirdTestImage.svg";
import DescriptionComponent from "../Description/DescriptionComponent";
import "./TestCards.css";

export default function TestCards() {
  const Skeleton = () => <div className="skeleton"></div>;

  const [tests, setTests] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.auth.userInfo);
  const isLoading = useSelector((state) => state.auth.loading);

  useEffect(() => {
    dispatch(getUserInfo());
  }, [dispatch]);

  const fetchTests = async (authToken, retries = 3, delay = 1000) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests",
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const fetchedTests = response.data.map((test) => ({
        id: test._id,
        title: test.title,
      }));

      setTests(fetchedTests);
    } catch (error) {
      if (error.response?.status === 429 && retries > 0) {
        console.warn(`Too Many Requests: Retrying in ${delay}ms...`);
        setTimeout(() => fetchTests(authToken, retries - 1, delay * 2), delay);
      } else {
        console.error("Error fetching tests:", error);
      }
    }
  };

  const fetchTestById = async (id) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return null;
    const url = id === "belbin" 
      ? `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests/belbin` 
      : `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests/${id}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching test details:", error);
      return null;
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!userInfo || !authToken) {
      console.warn("Missing user info or token. Aborting test fetch.");
      return;
    }
    fetchTests(authToken);
  }, [userInfo]);

  if (isLoading || !userInfo) {
    return <Skeleton />;
  }

  const handleStartClick = async (testId) => {
    const testData = await fetchTestById(testId);
    if (!testData) {
      alert("Failed to load test details.");
      return;
    }

    setSelectedTest({
      id: testData._id,
      title: testData.title,
      description: testData.description,
    });

    setShowDescription(true);
  };

  const filteredTests = tests.filter((test) =>
    test.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const images = [FirstTestImage, SecondTestImage, ThirdTestImage];

  return (
    <>
      <div className="testcards_main">
        <div className="testcards_controls">
          <h2 className="testcards_title">Тести</h2>
          <div className="search_filter_wrapper">
            <div className="searchbar_container">
              <input
                type="text"
                className="searchbar"
                placeholder="Пошук тестів..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="cards_wrapper justify-content-center">
          {filteredTests.map((test, index) => (
            <div className="firstCard" key={test.id}>
              <Card
                style={{
                  width: "23rem",
                  height: "36.5rem",
                  backgroundColor: "white",
                }}
              >
                <Card.Img
                  style={{
                    marginTop: "-2.1%",
                    marginLeft: "-3.4%",
                    width: "107%",
                  }}
                  variant="top"
                  src={images[index % images.length]}
                />

                <Card.Body className="flex-column align-items-center">
                  <Card.Title
                    style={{
                      color: "#292E46",
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    {test.title}
                  </Card.Title>
                  <Card.Text
                    style={{
                      color: "#292E46",
                      textAlign: "center",
                      fontSize: "13px",
                      paddingLeft: "10%",
                      paddingRight: "10%",
                    }}
                  >
                    Натисніть «Почати», щоб розпочати тест і дізнатися про свої
                    софт скіли
                  </Card.Text>
                  <Button
                    onClick={() => handleStartClick(test.id)}
                    variant="primary"
                    className="start_test_btn"
                  >
                    Почати
                  </Button>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {showDescription && selectedTest && (
        <DescriptionComponent
          show={showDescription}
          setShow={setShowDescription}
          test={selectedTest}
        />
      )}
    </>
  );
}
