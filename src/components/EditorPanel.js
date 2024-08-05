import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';

const PanelContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 30vh;
  background-color: white;
  padding: 20px;
  border-top: 1px solid black;
  overflow-y: auto;
  box-shadow: 0 -10px 100px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
`;

const EditorPanel = ({ selectedElement, updateSphere, closeEditor }) => {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (selectedElement) {
      setFormValues({ ...selectedElement });
    }
  }, [selectedElement]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: type === 'checkbox' ? checked : parseFloat(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateSphere(selectedElement.key, formValues);
    closeEditor();
  };

  return (
    <PanelContainer>
      <h3>Edit</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Mass:
          <input type="number" name="mass" value={formValues.mass || ''} onChange={handleChange} />
        </label>
        <br />
        <label>
          Lock:
          <input type="checkbox" name="locked" checked={formValues.locked || false} onChange={handleChange} />
        </label>
        <br />
        <button type="submit">Save</button>
        <button type="button" onClick={closeEditor}>Cancel</button>
      </form>
    </PanelContainer>
  );
};

export default EditorPanel;
