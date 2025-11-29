import React, {useState, useEffect} from "react";
import {Button, Modal, Form, Dropdown} from "react-bootstrap";
import "./ManageSkills.css";
import axios from "axios";
import Pencil from "../../Assets/Images/pencil.png";
import Delete from "../../Assets/Images/delete.png";

function ManageSkills() {
  const [skills, setSkills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [ShowEditModal, setShowEditModal] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [characteristics, setCharacteristics] = useState([]);
  const [newIDSKill, setNewIDSkill] = useState(null);
  const [newSkill, setNewSkill] = useState({
    type: "",
    characteristics: [],
  });
  const handleShowModal = () => setShowModal(true);

  const handleCloseModal = () => setShowModal(false);

  const handleShowEditModal = (id) => {
    const editingSkill = skills.find(skill => skill.id === id);
    setNewIDSkill(id);
    setShowEditModal(true);
  };


  const handleCloseEditModal = () => setShowEditModal(false);

  //save new soft-skill to database
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
      fetchSkills(authToken); // update soft-skills table
    } catch (error) {
      console.error("Error saving skill:", error);
      console.error("Error:", error.message);
    }
  };


  const handleEditSkill = async (e) => {
    const authToken = localStorage.getItem("authToken");
    
  
    try {
      const editedSkill = {
        type: newIDSKill.type,
        characteristics: newIDSKill.characteristics,
        
      };
      console.log("ID: " + editedSkill);
  
      const response = await axios.put(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills/${newIDSKill.id}`,
        editedSkill,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
  
      console.log("Skill edited successfully:", response.data);
      handleCloseEditModal();
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

        setSkills(prevSkills => prevSkills.filter((_, i) => i !== _id));

        console.log("Skill deleted successfully");
        handleCloseModal();
        fetchSkills(authToken);
    } catch (error) {
        console.error("Error deleting skill:", error);
        console.error("Error:", error.message);
    }
};


  const handleSkillChange = (e) => {
    setNewSkill({...newSkill, type: e.target.value});
  };

  //handle changes in characteristic input
  const handleCharacteristicChange = (e) => {

    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => ({
        characteristicId: option.value,
        title: option.textContent,
      })
    );
    setNewSkill({
      ...newSkill,
      characteristics: selectedOptions,
    });
    console.log(selectedOptions);
  };

  useEffect(() => {
    console.log("newskill");

    console.log(newSkill);
  }, [newSkill]);

  //get skills from database
  const fetchSkills = async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills",
        {
          headers: {Authorization: `Bearer ${authToken}`},
        }
      );
      const fetchedSkills = response.data.map((skill) => ({
        title: skill.type, 
        id: skill._id,
        characteristics: skill.characteristics.map((c) => c.title), //Taking just name of characteristic
      }));
      setSkills(fetchedSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };


  //get characteristics from database
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
        <h1 className="manageTable__title">Soft skills</h1>
        
        <button type="button" className="manageTable__add" onClick={handleShowModal}>
          <svg className="manageTable__ico" width="35" height="33" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.91998 16.5H31.2" stroke="#384699" strokeWidth="6" strokeLinecap="round"/>
            <path d="M17.56 30V3.00001" stroke="#384699" strokeWidth="6" strokeLinecap="round"/>
          </svg>
          Add new soft skill...
        </button>

        <table className="manageTable__table">
          <div className="manageTable__body">
            {skills.map((skill, index) => (
              <div className="manageTable__tr" key={index}>
                <div className="manageTable__td-wrap">
                  <div className="manageTable__td">{skill.title}</div>
                  <div className="manageTable__td">{skill.characteristics.join(", ")}</div>
                </div>
                <button className="manageTable__btn" type="button" onClick={() => handleShowEditModal(skill)}>
                  <img src={Pencil} alt="Edit" />
                </button>
                <button className="manageTable__btn" type="button" onClick={() => handleDeleteSkill(skill.id)}>
                    <img src={Delete} alt="Delete" />
                </button>
              </div>
            ))}
          </div>
        </table>
      </div>

      <Modal show={ShowEditModal} onHide={handleCloseEditModal}>
        <Modal.Header className="modalHeader" closeButton>
          <Modal.Title className="titleModal">Edit soft skill</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>New title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                className="titleInput"
                value={editingTitle}
                onChange={handleSkillChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>New characteristics</Form.Label>
              <Form.Control
                as="select"
                multiple
                onChange={handleCharacteristicChange}
                className="characteristicsList"
              >
                {characteristics.map((char, index) => (
                  <option key={index} value={char._id}>
                    {char.title}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Close
          </Button>
          <Button variant="primary" className="saveButton" onClick={() => handleEditSkill(skills.id)}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>



      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header className="modalHeader" closeButton>
          <Modal.Title className="titleModal">Add New Soft Skill</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                className="titleInput"
                value={newSkill.type}
                onChange={handleSkillChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Characteristics</Form.Label>
              <Form.Control
                as="select"
                multiple
                onChange={handleCharacteristicChange}
                className="characteristicsList"
              >
                {characteristics.map((char, index) => (
                  <option key={index} value={char._id}>
                    {char.title}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" className="saveButton" onClick={handleSaveSkill}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ManageSkills;