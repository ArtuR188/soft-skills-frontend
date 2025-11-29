import React, {useState, useEffect} from "react";
import {Button, Modal, Form, Row, Col} from "react-bootstrap";
import "./ManageSkills.css";
import axios from "axios";

import Pencil from "../../Assets/Images/pencil.png";
import Delete from "../../Assets/Images/delete.png";

function ManageSkills() {
  const [skills, setSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [characteristics, setCharacteristics] = useState([]);
  const [newSkill, setNewSkill] = useState({
    type: "",
    characteristics: [],
  });
  const [newCharacteristic, setNewCharacteristic] = useState('');
  const [selectedAddedCharacteristics, setSelectedAddedCharacteristics] = useState([]);
  
  const handleShowModal = () => {
    setShowModal(true);
    setNewSkill({
      type: "",
      characteristics: [],
    });
    setIsCharacteristicsValid(false);
  };
  const [isEditting, setIsEditting] = useState(false);
  const [skillToEdit, setSkillToEdit] = useState({});
  const [isCharacteristicsValid, setIsCharacteristicsValid] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditting(false);
    setIsCharacteristicsValid(false); 
  };

  const handleEditSkill = (skill) => {
    setIsEditting(true);
    setSkillToEdit(skill);
    setShowModal(true);
    setNewSkill({
      type: skill.title,
      characteristics: skill.characteristics.map((c) => ({
        characteristicId: c,
        title: c,
      })),
    });
    setIsCharacteristicsValid(skill.characteristics.length > 0);
  };

  const handleEditSaveSkill = async () => {
    const authToken = localStorage.getItem("authToken");
    try {
      console.log("Attempting to edit skill:", newSkill);
      const response = await axios.patch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills/${skillToEdit.id}`,
        newSkill,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("Skill edited successfully:", response.data);
      handleCloseModal();
      fetchSkills(authToken); 
    } catch (error) {
      console.error("Error editing skill:", error);
      console.error("Error:", error.message);
    }
  };

  const handleDeleteSkill = async (_id) => {
    const authToken = localStorage.getItem("authToken");
    console.log(_id);

    try {
      await axios.delete(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills/${_id}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      setSkills(prevSkills => prevSkills.filter(skill => skill.id !== _id));

      console.log("Skill deleted successfully");
      handleCloseModal();
      fetchSkills(authToken);
    } catch (error) {
      console.error("Error deleting skill:", error);
      console.error("Error:", error.message);
    }
  };

  const handleSaveSkill = async () => {
    const authToken = localStorage.getItem("authToken");

    try {
      console.log("Attempting to save skill:", newSkill);
      const response = await axios.post(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills",
        newSkill,
        {headers: {Authorization: `Bearer ${authToken}`}}
      );
      console.log("Skill saved successfully:", response.data);
      handleCloseModal();
      fetchSkills(authToken); 
    } catch (error) {
      console.error("Error saving skill:", error);
      console.error("Error:", error.message);
    }
  };

  const handleSkillChange = (e) => {
    setNewSkill({...newSkill, type: e.target.value});
  };

  const handleCharacteristicChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => ({
      characteristicId: option.value,
      title: option.textContent,
    }));
  
    const updatedCharacteristics = [...newSkill.characteristics, ...selectedOptions].reduce((acc, char) => {
      if (!acc.some(c => c.characteristicId === char.characteristicId)) {
        acc.push(char);
      }
      return acc;
    }, []);
  
    setNewSkill({
      ...newSkill,
      characteristics: updatedCharacteristics,
    });
  
    setIsCharacteristicsValid(updatedCharacteristics.length > 0);
  };

  const handleSelectedCharacteristicChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => ({
      characteristicId: option.value,
      title: option.textContent,
    }));
    setSelectedAddedCharacteristics(selectedOptions);
  };
  

  const deleteSelectedCharacteristic = (characteristicId) => {
    setNewSkill((prevState) => ({
      ...prevState,
      characteristics: prevState.characteristics.filter(
        (char) => char.characteristicId !== characteristicId
      ),
    }));
  };
  
  
  useEffect(() => {
    console.log("newskill");
    console.log(newSkill);
  }, [newSkill]);

  const fetchSkills = async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills",
        {
          headers: {Authorization: `Bearer ${authToken}`},
        }
      );
      const fetchedSkills = response.data.map((skill) => ({
        id:skill._id,
        title: skill.type,
        characteristics: skill.characteristics.map((c) => c.title), 
      }));
      setSkills(fetchedSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };

  const fetchCharacteristics = async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics",
        {
          headers: {Authorization: `Bearer ${authToken}`},
        }
      );
      const fetchedCharacteristics = response.data.map((char) => ({
        _id: char._id,
        title: char.title,
      }));

      console.log(fetchedCharacteristics);
      setCharacteristics(fetchedCharacteristics);
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    }
  };

  const addNewCharacteristic = async () => {
    const authToken = localStorage.getItem("authToken");
    
    if (newCharacteristic.trim() === "") return;
    
    try {
      console.log(authToken,'authToken')
      const response = await axios.post(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics",
        { title: newCharacteristic },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      const { _id, title } = response.data;

      const fetchedCharacteristics = {
        _id,
        title
      }
      
      setCharacteristics(characteristics => [...characteristics, fetchedCharacteristics]);
      setNewCharacteristic('');
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    }
  };
  
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }

    fetchSkills(authToken);
    fetchCharacteristics(authToken);
  }, []);

  return (
    <>
            <div className="manageTable">
        <h1 className="manageTable__title">Софт Скіли</h1>
        
        <button type="button" className="manageTable__add" onClick={handleShowModal}>
          <svg className="manageTable__ico" width="35" height="33" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.91998 16.5H31.2" stroke="#292E46" strokeWidth="6" strokeLinecap="round"/>
            <path d="M17.56 30V3.00001" stroke="#292E46" strokeWidth="6" strokeLinecap="round"/>
          </svg>
          Додати новий...
        </button>

        <table className="manageTable__table">
          <div className="manageTable__body">
          {skills.map((skill, index) => (
            <div className="manageTable__tr" key={index}>
              <div className="manageTable__td-wrap">
                <div className="manageTable__td skill_admin">{skill.title}</div>
                <div className="char_skill">
                <div className="manageTable__td">{skill.characteristics.join(", ")}</div>
              </div>
              </div>
              <button className="manageTable__btn" type="button" onClick={() => handleEditSkill(skill)}>
          <img src={Pencil} alt="Pencil"/>
        </button>
              <button className="manageTable__btn" type="button" onClick={() => handleDeleteSkill(skill.id)}>
                <img src={Delete} alt="Delete"/>
              </button>
            </div>
          ))}
          </div>
        </table>
      </div>

      <Modal size="xl" show={showModal} onHide={handleCloseModal}>
        <Modal.Header className="modalHeader" closeButton>
          <Modal.Title className="titleModal">
            {isEditting ? "Edit Soft Skill" : "Add New Soft Skill"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Form.Group className="mb-3">
            <Form.Label>Назва</Form.Label>
            <Form.Control
              type="text"
              name="title"
              className="titleInput"
              value={newSkill.type}
              onChange={handleSkillChange}
              style={{ color: "#382B4A" }}
            />
          </Form.Group>
          <Row>
            <Col xs={6}>
              <Form>
                <Form.Group required className="mb-3">
                  <Form.Label>Характеристики</Form.Label>
                  <Form.Control
                    as="select"
                    multiple
                    className="charactList"
                    onChange={handleCharacteristicChange}
                    required
                  >
                    {characteristics.map((char, index) => (
                      <option key={index} value={char._id}>
                        {char.title}
                      </option>
                    ))}
                  </Form.Control>
                  {!isCharacteristicsValid && (
                    <div style={{ color: '#fffff' }}>
                      Оберіть хоча б одну характеристику.
                    </div>
                  )}
                </Form.Group>
              </Form>
            </Col>
            <Col xs={6}>
              <Form>
                <Form.Group required className="mb-3">
                  <Form.Label>Обрані характеристики:</Form.Label>
                  <div className="charactList addedCharactList">
                    {newSkill.characteristics.map((char, index) => (
                      <div key={index} className="selectedCharacteristicItem">
                        <span>{char.title}</span>
                        <button 
                          
                          type="button"
                          onClick={() => deleteSelectedCharacteristic(char.characteristicId)}
                          
                        > ✕
                          
                        </button>
                      </div>
                    ))}
                  </div>
                  {!isCharacteristicsValid && (
                    <div style={{ color: '#fffff' }}>
                      Будь ласка, виберіть хоча б одну характеристику.
                    </div>
                  )}
                </Form.Group>
              </Form>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="secondary" onClick={handleCloseModal}>
            Закрити
          </Button>
          {isEditting ? (
            <Button variant="primary" className="saveButton" onClick={handleEditSaveSkill}>
              Зберегти зміни
            </Button>
          ) : (
            <Button variant="primary" className="saveButton" onClick={handleSaveSkill}>
              Зберегти
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ManageSkills;
