import React, { useState, useEffect } from "react";
import {
  Card,
  Col,
  Row,
  Button,
  Modal,
  Form,
  Toast,
  Pagination,
} from "react-bootstrap";
import axios from "axios";
import "./UserList.css";
import uimg from "../../Assets/Images/avatar.png";

function UserList() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);

  const [searchQuery, setSearchQuery] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [courseFilter, setCourseFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [currentUser, setCurrentUser] = useState({});

  const [directionOptions] = useState([
    "Web-programming",
    "Data science",
    "Business Analysis",
    "DevOps",
    "Management",
    "Digital Economy",
    "Digital Marketing and sales",
  ]);
const [courseOptions] = useState([1, 2, 3, 4]);

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    direction: "",
    course: "",
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      console.error("Auth token is not available.");
      return;
    }
    fetchUsers(authToken);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, directionFilter, courseFilter]);

  const fetchUsers = async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const filterUsers = () => {
    let filtered = users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = user.email.toLowerCase();
      const matchesQuery =
        fullName.includes(searchQuery.toLowerCase()) ||
        email.includes(searchQuery.toLowerCase());

      const matchesDirection =
        !directionFilter || user.direction === directionFilter;

      const matchesCourse = !courseFilter || user.course === courseFilter;

      return matchesQuery && matchesDirection && matchesCourse;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      direction: user.direction || "",
      course: user.course || "",
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const authToken = localStorage.getItem("authToken");
    try {
      await axios.patch(
        `http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/users/${currentUser._id}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      setShowModal(false);
      setShowToast(true);
      fetchUsers(authToken);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="all_users text-center">
        <h1>Користувачі</h1>
      </div>

      <Row className="mb-4 justify-content-center">
        <Col md={3}>
          <Form.Select
            className="custom-select"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
          >
            <option value="">Усі напрямки</option>
            {directionOptions.map((dir, idx) => (
              <option key={idx} value={dir}>
                {dir}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select
           className="custom-select"
  value={courseFilter}
  onChange={(e) => setCourseFilter(Number(e.target.value))}
>
  <option value={0}>Усі курси</option>
  {courseOptions.map((course) => (
    <option key={course} value={course}>
      Курс {course}
    </option>
  ))}
</Form.Select>

        </Col>
        <Col md={4}>
          <Form.Control
            type="text"
            placeholder="Пошук за ім’ям або поштою"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Col>
      </Row>

      <Row xs={2} md={3} className="g-4">
        {currentUsers.map((user, index) => (
          <Col key={index}>
            <Card className="flex a_usercard text-center">
              <Card.Img style={{ width: "50%" }} variant="top" src={uimg} />
              <Card.Body>
                <Card.Title>
                  {`${user.firstName} ${user.lastName}`}
                </Card.Title>
                <Card.Text>Пошта: {user.email}</Card.Text>
                <Card.Text>Напрямок: {user.direction}</Card.Text>
                <Card.Text>Курс: {user.course}</Card.Text>
                <Button
                  className="user_edit"
                  variant="primary"
                  onClick={() => handleEditClick(user)}
                >
                  Редагувати
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Pagination className="pagination_ justify-content-center">
        {[...Array(totalPages)].map((_, number) => (
          <Pagination.Item
            key={number + 1}
            active={number + 1 === currentPage}
            onClick={() => paginate(number + 1)}
          >
            {number + 1}
          </Pagination.Item>
        ))}
      </Pagination>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header className="modalHeader" closeButton>
          <Modal.Title>Редагувати користувача</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modalBody">
          <Form onSubmit={handleFormSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Ім'я</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={editFormData.firstName}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Прізвище</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={editFormData.lastName}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Пошта</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleFormChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Напрямок</Form.Label>
              <Form.Select
                name="direction"
                value={editFormData.direction}
                onChange={handleFormChange}
                required
              >
                {directionOptions.map((option, idx) => (
                  <option key={idx} value={option}>
                    {option}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Курс</Form.Label>
              <Form.Select
                name="course"
                value={editFormData.course}
                onChange={handleFormChange}
                required
              >
                {courseOptions.map((course, idx) => (
                  <option key={idx} value={course}>
                    {course}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button className="user_edit" variant="primary" type="submit">
              Зберегти зміни
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

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
          backgroundColor: "#dff0d8",
        }}
      >
        <Toast.Header style={{ backgroundColor: "#5cb85c", color: "white" }}>
          <strong className="me-auto">Користувача оновлено</strong>
        </Toast.Header>
        <Toast.Body>Користувача успішно оновлено!</Toast.Body>
      </Toast>
    </>
  );
}

export default UserList;
