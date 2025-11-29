import React, { useState, useEffect } from "react";
import axios from "axios";
import { Select, MenuItem, FormControl, IconButton, TextField } from "@mui/material";
import { Radio,  FormControlLabel} from "@mui/material";
import { FormGroup } from "@mui/material";
import Form from "react-bootstrap/Form";
import { MenuProps } from "./MenuProps";
import "./DNDconstructor.css"

const RadioButtonItem = ({
  content,
  characteristics,
  index,
  onDelete,
  onUpdate,
}) => {
  const [options, setOptions] = useState([
    { label: "Radio 1", points: 1, characteristicId: "65c3adfbfe2b0e98e5ba7374" },
    { label: "Radio 2", points: 1, characteristicId: "65c3adfbfe2b0e98e5ba7374" },
  ]);
  const [characteristicsList, setCharacteristicsList] = useState([]);
  const [questionName, setQuestionName] = useState("QuestionName");

  useEffect(() => {
    const arrCharacteristics = characteristics.map(el => ({
      _id: el._id,
      title: el.title,
    }))

    setCharacteristicsList(arrCharacteristics);

  }, [characteristics]);

  useEffect(() => {
    onUpdate(index, {
      content: questionName,
      options: options.map((option) => ({
        label: option.label,
        points: option.points,
        characteristicId: option.characteristicId,
      })),
    });
  }, [questionName, options, onUpdate, index, content]);

  const fetchCharacteristics = async () => {
    const authToken = localStorage.getItem("authToken");
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
      setCharacteristicsList(fetchedCharacteristics);
    } catch (error) {
      console.error("Error fetching characteristics:", error);
    }
  };

  const handleCharacteristicChange = (optionIndex, event) => {
    const newCharacteristicId = event.target.value;
    const updatedOptions = options.map((option, idx) => {
      if (idx === optionIndex) {
        return { ...option, characteristicId: newCharacteristicId };
      }
      return option;
    });
    setOptions(updatedOptions);
  };

  const handleOptionChange = (idx, field, value) => {
    setOptions(
      options.map((option, optionIndex) =>
        optionIndex === idx ? { ...option, [field]: value } : option
      )
    );
  };

  const handleAddOption = () => {
    setOptions([
      ...options,
      {
        id: options.length + 1,
        label: `Radio ${options.length + 1}`,
        points: 1,
        characteristicId: "65c3adfbfe2b0e98e5ba7374",
      },
    ]);
  };

  const handleDeleteOption = (idx) => {
    setOptions(options.filter((_, optionIndex) => optionIndex !== idx));
  };

  return (
    <div className="question-item">
      <div className="fristWrapper">
        <p className="firstQuestion">{index + 1}</p>
        <input
          className="fristQuestionText"
          contenteditable="true"
          value={questionName}
          required
          onChange={(e) => setQuestionName(e.target.value)}
        />
        <button className="closeButton" onClick={() => onDelete(index)}>
          X
        </button>
      </div>
      <div className="option-dndcontainer">
      <div className="correct-answer-dndssection" style={{ display: "flex" }}>
    
          <div>
            {options.map((option, idx) => (
              <div
                key={idx}
             
                className="checkbox-with-form-control option-container"
              >
                <FormControlLabel
                  control={<Radio checked={false} />}
                  label={
                    <TextField
                      size="small"
                      value={option.label}
                      onChange={(e) =>
                        handleOptionChange(idx, "label", e.target.value)
                      }
                    />
                  }
                />
                <Form.Control
                  size="sm"
                  type="number"
                  placeholder="+/- 1"
                  className="addPointsYN"
                  value={option.points}
                  onChange={(e) =>
                    handleOptionChange(idx, "points", Number(e.target.value))
                  }
                  style={{ margin: "0", width: "100px" }}
                  required
                />
                <FormControl style={{ width: "200px", marginLeft: "10px" }}>
                  <Select
                    displayEmpty
                    className="ch_mult_txt"
                    value={option.characteristicId}
                    onChange={(event) => handleCharacteristicChange(idx, event)} 
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <em>Choose characteristic</em>;
                      }
                      const selectedChar = characteristicsList.find(
                        (char) => char._id === selected
                      );
                      return selectedChar ? (
                        selectedChar.title
                      ) : (
                        <em>Choose characteristic</em>
                      );
                    }}
                    MenuProps={MenuProps}
                    inputProps={{ "aria-label": "Without label" }}
                  >
                    <MenuItem disabled value="">
                      <em>Choose characteristic</em>
                    </MenuItem>
                    {characteristicsList.map((char) => (
                      <MenuItem key={char._id} value={char._id}>
                        {char.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <IconButton
                  onClick={() => handleDeleteOption(idx)}
                  style={{ marginLeft: "10px", marginTop: "10px" }}
                >
                  X
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      </div>
      <FormGroup>
        <IconButton onClick={handleAddOption} color="primary" size="small">
          <div className="circlee">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="23"
              height="23"
              viewBox="0 0 23 23"
              fill="none"
            >
              <path
                d="M0 4C0 1.79086 1.79086 0 4 0H19C21.2091 0 23 1.79086 23 4V19C23 21.2091 21.2091 23 19 23H4C1.79086 23 0 21.2091 0 19V4Z"
                fill="#DBDFF4"
              />
              <path
                d="M4.13998 11.5H18.4"
                stroke="#384699"
                stroke-width="3"
                stroke-linecap="round"
              />
              <path
                d="M11.27 18.4V4.60002"
                stroke="#384699"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </IconButton>
      </FormGroup>
    </div>
  );
};
export default RadioButtonItem;
