import "./ProfileGraphic.css";
import { Card, ListGroup} from "react-bootstrap";
import { LineChart, Line, XAxis, Tooltip,ResponsiveContainer } from 'recharts';
import axios from "axios";
import React, {useState, useEffect,useCallback } from "react";

export default function ProfileGraphic() {

  const [data, setData] = useState([]);

  const [skills, setSkills] = useState([]);
  const fetchSkills = useCallback(async (authToken) => {
    try {
      const response = await axios.get(
        "http://ec2-13-61-182-81.eu-north-1.compute.amazonaws.com/soft-skills",
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const fetchedSkills = response.data.map((skill) => ({
        id: skill._id,
        title: skill.type,
        characteristics: skill.characteristics.map((c) => c.title),
      }));
      setSkills(fetchedSkills);
      generateData(fetchedSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  }, []); 
  
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    fetchSkills(authToken);
  }, [fetchSkills]);

  const generateData = (skills) => {
    const newData = skills.map((skill) => ({
      name: skill.title,
      level: Math.floor(Math.random() * 11),
    }));
    setData(newData);
  };
  return (
    <>
      <div className="graphic_main">
      <div className="mainWrapper" >
      <Card className='skillsCard'>
        <Card.Header style={{textAlign:'center',fontSize:'40px'}}>Рівень soft skills</Card.Header>
        <ListGroup  variant="flush">
          {skills.map((item, idx) => (
            <ListGroup.Item className='skill_item' key={idx}>{item.title}</ListGroup.Item>
          ))}
        </ListGroup>
      </Card>

      <Card className="graph_card">
        <Card.Header style={{textAlign:'center',fontSize:'40px'}}>Графік змін:</Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 30,
                bottom: 5,
              }}
            >
              <XAxis style={{fontSize:'14px'}} dataKey="name" stroke="transparent" fill="transparent" />
              <Tooltip itemStyle={{ color: 'black' }}  />
              <Line type="monotone" dataKey="level" stroke="white" fill="#0000FF"  strokeWidth={3} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </div>
      </div>
    </>
  );
}
