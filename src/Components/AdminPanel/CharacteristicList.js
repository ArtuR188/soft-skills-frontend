import React, {useState, useEffect} from "react";
import {Button, Modal, Form} from "react-bootstrap";
import "./ManageSkills.css";
import axios from "axios";
import Delete from "../../Assets/Images/delete.png";

function ManageSkills() {
  const [characteristics, setCharacteristics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newCharacteristic, setNewCharacteristic] = useState("");
  const [deleteCharacteristicId, setDeleteCharacteristicId] = useState(null);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleShowDeleteModal = (id) => {
    setDeleteCharacteristicId(id);
    setShowDeleteModal(true);
  };
  const handleCloseDeleteModal = () => setShowDeleteModal(false);

  const handleCharacteristicChange = (e) => {
    setNewCharacteristic(e.target.value);
  };

  const handleSaveCharacteristic = async () => {
    const authToken = localStorage.getItem("authToken");

    try {
      const response = await axios.post(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics",
        { title: newCharacteristic },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log("Characteristic saved successfully:", response.data);
      setCharacteristics([...characteristics, { _id: response.data._id, title: newCharacteristic }]);
      handleCloseModal();
    } catch (error) {
      console.error("Error saving characteristic:", error);
    }
  };

  const handleDeleteCharacteristic = async () => {
    const authToken = localStorage.getItem("authToken");
    try {
      await axios.delete(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics/${deleteCharacteristicId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setCharacteristics(characteristics.filter(char => char._id !== deleteCharacteristicId));
      handleCloseDeleteModal();
    } catch (error) {
      console.error(`Error deleting characteristic:`, error);
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }

    const fetchCharacteristics = async () => {
      try {
        const response = await axios.get(
          "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/characteristics",
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setCharacteristics(response.data.map((char) => ({
          _id: char._id,
          title: char.title,
        })));
      } catch (error) {
        console.error("Error fetching characteristics:", error);
      }
    };

    fetchCharacteristics();
  }, []);

  return (
    <>
      <div className="manageTable">
        <h1 className="manageTable__title">Характеристики</h1>
        
        <button type="button" id="add_characteristic" className="manageTable__add" onClick={handleShowModal}>
          <svg className="manageTable__ico" width="35" height="33" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.91998 16.5H31.2" stroke="#292E46" strokeWidth="6" strokeLinecap="round"/>
            <path d="M17.56 30V3.00001" stroke="#292E46" strokeWidth="6" strokeLinecap="round"/>
          </svg>
         Додати нову характеристику...
        </button>

        <table className="manageTable__table">
          <div className="manageTable__body">
          {characteristics.map((char, index) => (
            <div className="manageTable__tr" key={index}>
              <div className="manageTable__td-wrap">
                <div className="manageTable__td">{char.title}</div>
              </div>
             
              <button className="manageTable__btn" onClick={() => handleShowDeleteModal(char._id)}>
                <img src={Delete} alt="Delete"/>
              </button>
            </div>
          ))}
          </div>
        </table>
      </div>

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header className="modalHeader" closeButton>
          <Modal.Title className="titleModal">Додати нову характеристику</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Назва</Form.Label>
              <Form.Control
                name="characteristic_input"
                type="text"
                placeholder="Enter characteristic title"
                value={newCharacteristic}
                onChange={handleCharacteristicChange}

              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modalFooter">
          <Button variant="secondary" className="saveButton" onClick={handleCloseModal}>
            Скасувати
          </Button>
          <Button  className="saveButton" onClick={handleSaveCharacteristic}>
            Зберегти
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Підтвердження видалення</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Чи ви впевнені що хочете видалити цю характеристику?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" className="saveButton" onClick={handleCloseDeleteModal}>
            Скасувати
          </Button>
          <Button variant="danger"  onClick={handleDeleteCharacteristic}>
            Видалити
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ManageSkills;
