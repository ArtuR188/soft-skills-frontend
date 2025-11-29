import React, { useState, useEffect } from "react";
import axios from "axios";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Select,
  MenuItem,
  FormControl,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import RemoveIcon from "@mui/icons-material/Remove";
import { Accordion } from "react-bootstrap";
import Toast from "react-bootstrap/Toast";
import DraggableYesNoQuestion from "./DraggableYesNoQuestion";
import DraggableMultiChoice from "./DraggableMultiChoiceQuestion";
import DraggableSliderQuestion from "./DraggableSliderQuestion";
import DraggableRadioButton from "./RadioButtonQuestion";
import YesNoQuestionItem from "./YesNoQuestionItem";
import MultiChoiceItem from "./MultiChoiceItem";
import SliderQuestionItem from "./SliderQuestionItem";
import RadioButtonItem from "./RadioButtonItem";
import DropArea from "./DropedArea";
import { ItemTypes } from "./ItemTypes";
import "./DNDconstructor.css"

function DNDconstructor() {
  const [items, setItems] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState(
    JSON.parse(localStorage.getItem("common-characteristic")) || []
  );
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerValue, setTimerValue] = useState(0);

  const addItem = (newItem) => {
    const updatedItems = [...items, { ...newItem, id: Math.random() }];
    setItems(updatedItems);
    localStorage.setItem("dnd-items", JSON.stringify(updatedItems));
  };

  const deleteItem = (index) => {
    const updatedItems = items.filter((_, idx) => idx !== index);
    setItems(updatedItems);
    localStorage.setItem("dnd-items", JSON.stringify(updatedItems));
  };

  const updateItem = (index, newItemContent) => {
    const updatedItems = items.map((item, idx) =>
      idx === index ? { ...item, ...newItemContent } : item
    );
    setItems(updatedItems);
    localStorage.setItem("dnd-items", JSON.stringify(updatedItems));
  };
  const handleCreateTest = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const savedItems = Array.isArray(JSON.parse(localStorage.getItem("dnd-items"))) 
        ? JSON.parse(localStorage.getItem("dnd-items")) 
        : [];
  
      if (!testTitle.trim()) {
        setToastMessage("Please provide a title for the test.");
        setShowToast(true);
        return;
      }
  
      if (!savedItems || savedItems.length === 0) {
        setToastMessage("Please add at least one question to the test.");
        setShowToast(true);
        return;
      }
  
      const questionsForApi = savedItems.map((item) => {
        if (item.type === ItemTypes.MULTI_CHOICE && item.options) {
          const answers = item.options.map((opt) => opt.label);
          const correctAnswers = item.options.map((opt) => opt.checked);
          const characteristics = item.options.map((opt) => ({
            characteristicId: opt.characteristicId,
            points: opt.points,
          }));
  
          return {
            question: item.content,
            type: "multiple_choice",
            answers: answers,
            correctAnswers: correctAnswers,
            characteristics: characteristics,
          };
        } else if (item.type === ItemTypes.YES_NO_QUESTION) {
          return {
            question: item.content,
            type: "yes_no",
            answers: item.answers,
            correctAnswers: item.answers.map((answer) => answer === "Yes"),
            characteristics: [
              {
                characteristicId: item.characteristics[0].id,
                points: item.points[0],
              },
              {
                characteristicId: item.characteristics[1].id,
                points: item.points[1],
              },
            ],
          };
        } else if (item.type === ItemTypes.SLIDER) {
          return {
            question: item.content,
            type: "slider",
            answers: item.answers,
            characteristics: item.characteristics,
          };
        } else if (item.type === ItemTypes.RADIO && item.options) {
          const answers = item.options.map((opt) => opt.label);
          const correctAnswers = item.options.map((opt) => opt.checked);
          const characteristics = item.options.map((opt) => ({
            characteristicId: opt.characteristicId,
            points: opt.points,
          }));
  
          return {
            question: item.content,
            type: "radio",
            answers: answers,
            correctAnswers: correctAnswers,
            characteristics: characteristics,
          };
        }
      }).filter(Boolean);

      const responses = await Promise.all(
        questionsForApi.map((question) =>
          axios.post(
            "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/questions",
            question,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          )
        )
      );
  
      const questionIds = responses.map((response) => response.data._id);
  
      const testData = {
        title: testTitle,
        questions: questionIds,
        timer: isTimerEnabled ? timerValue * 60 : 0 
      };

      const testResponse = await axios.post(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/tests",
        testData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );
  
      console.log("Test created:", testResponse.data);
      setToastMessage("Test successfully created!");
      setShowToast(true);
  
      localStorage.removeItem("dnd-items");
      setItems([]);
      setTestTitle("");
      setIsTimerEnabled(false);
      setTimerValue(0);
    } catch (error) {
      console.error("Error creating test:", error);
  
      let errorMessage = "Error creating test: ";
  
      if (error.response) {
        if (error.response.status === 500) {
          errorMessage += "Fill all fields to create the test.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage += error.response.data.message.join(", ");
        } else {
          errorMessage += ` Status code ${error.response.status}.`;
        }
      } else if (error.request) {
        errorMessage += "The request was made but no response was received.";
      } else {
        errorMessage += error.message;
      }
  
      setToastMessage(errorMessage);
      setShowToast(true);
    }
  };
  
  
  const handleSkillChange = (event) => {
    if (!selectedSkills.some((el) => el._id === event.target.value._id)) {
      setSelectedSkills([...selectedSkills, event.target.value]);
    }
  };

  const handleDeleteSkill = (skillToDelete) => {
    setSelectedSkills(
      selectedSkills.filter((skill) => skill._id !== skillToDelete)
    );
  };

  useEffect(() => {
    const savedItems = JSON.parse(localStorage.getItem("dnd-items"));
    if (savedItems) {
      setItems(savedItems);
    }
  }, []);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }
    fetchCharacteristics(authToken);
  }, []);

  const fetchCharacteristics = async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const fetchedCharacteristics = response.data.map((char) => ({
        _id: char._id,
        title: char.title,
      }));

      setSkills(fetchedCharacteristics);
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    }
  };

  useEffect(() => {
    localStorage.setItem("common-characteristic", JSON.stringify(selectedSkills));
  }, [selectedSkills]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app">
        <aside className="side-panel">
          <DraggableYesNoQuestion content="Питання Так\Ні" />
          <DraggableMultiChoice content="Питання з кількома варіантами" />
          <DraggableSliderQuestion content="Питання з повзунком" />
          <DraggableRadioButton content="'Радіо' тип питання" />
        </aside>

        <main className="main-content">
          <input
            className="test_name"
            placeholder="Назва тесту"
            value={testTitle}
            onChange={(e) => setTestTitle(e.target.value)}
          />
          <div className="accordion-wrapper">
          <Accordion className="accordion-header" defaultActiveKey={["0"]} alwaysOpen>
  <Accordion.Item eventKey="0">
    <Accordion.Header className="accordion-header">
    Оберіть характеристики
    </Accordion.Header>
    <Accordion.Body className="accordion-body">
      <div className="question-SKILLS">
        <div className="fristWrapper">
          <span className="skill-text">Оберіть категорії софт скілів...</span>
        </div>
        <FormControl fullWidth>
          <Select
            className="skill-select"
            id="skill-selector"
            value=""
            onChange={handleSkillChange}
            renderValue={() => ""}
          >
            {skills.map((skill) => (
              <MenuItem key={skill._id} value={skill}>
                {skill.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <List dense>
          <h2 className="selected-skills-title">Обрані скіли:</h2>
          {selectedSkills.map((skill) => (
            <div key={skill._id} className="item">
              <ListItem
                secondaryAction={
                  <section>
                    <IconButton edge="end" aria-label="check" className="check-icon">
                      <CheckIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDeleteSkill(skill._id)}
                      className="delete-icon"
                    >
                      <RemoveIcon sx={{ color: "white" }} />
                    </IconButton>
                  </section>
                }
              >
                <ListItemText primary={skill.title} />
              </ListItem>
            </div>
          ))}
        </List>
      </div>
    </Accordion.Body>
  </Accordion.Item>
</Accordion>
</div>
          <div className="item-list">
            {items.map((item, index) => {
              if (item.type === ItemTypes.YES_NO_QUESTION) {
                return (
                  <YesNoQuestionItem
                    key={item.id}
                    content={item.content}
                    points={item.points}
                    answers={item.answers}
                    index={index}
                    onDelete={deleteItem}
                    items={items}
                    onUpdate={updateItem}
                    characteristics={selectedSkills}
                  />
                );
              } else if (item.type === "multiple_choice") {
                return (
                  <MultiChoiceItem
                    key={item.id}
                    content={item.content}
                    points={item.points}
                    answers={item.answers}
                    index={index}
                    onDelete={deleteItem}
                    items={items}
                    onUpdate={updateItem}
                    characteristics={selectedSkills}
                  />
                );
              } else if (item.type === "slider") {
                return (
                  <SliderQuestionItem
                    key={item.id}
                    content={item.content}
                    points={item.points}
                    answers={item.answers}
                    index={index}
                    onDelete={deleteItem}
                    items={items}
                    onUpdate={updateItem}
                    characteristics={selectedSkills}
                  />
                );
              } else if (item.type === "radio") {
                return (
                  <RadioButtonItem
                    key={item.id}
                    content={item.content}
                    points={item.points}
                    answers={item.answers}
                    index={index}
                    onDelete={deleteItem}
                    items={items}
                    onUpdate={updateItem}
                    characteristics={selectedSkills}
                  />
                );
              }
            })}
          </div>
          <div className="timer-settings">
            <label>
              <input
                type="checkbox"
                checked={isTimerEnabled}
                onChange={(e) => setIsTimerEnabled(e.target.checked)}
              />
              Таймер
            </label>

            {isTimerEnabled && (
              <div>
                <label>Ліміт у часі (в хвилинах):</label>
                <input
                  type="number"
                  value={timerValue}
                  onChange={(e) => setTimerValue(Number(e.target.value))}
                  min="1"
                />
              </div>
            )}
          </div>

          <DropArea onAddItem={addItem} items={items} />
          <button className="create_test" onClick={handleCreateTest}>
            Створити тест
          </button>

         

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
              backgroundColor: toastMessage.startsWith("Error")
                ? "#f8d7da"
                : toastMessage.startsWith("Please")
                ? "#fff3cd"
                : "#dff0d8",
            }}
          >
            <Toast.Header
              style={{
                backgroundColor: toastMessage.startsWith("Error")
                  ? "#d9534f"
                  : toastMessage.startsWith("Please")
                  ? "#ffbb00"
                  : "#5cb85c",
                color: "white",
              }}
            >
              <strong className="me-auto">Конструктор Тестів</strong>
            </Toast.Header>
            <Toast.Body>{toastMessage}</Toast.Body>
          </Toast>
        </main>
      </div>
    </DndProvider>
  );
}

export default DNDconstructor;
