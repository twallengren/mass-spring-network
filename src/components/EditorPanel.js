import React, { useState, useEffect } from 'react';

const EditorPanel = ({ selectedElement, updateSphere, updateConnection, closeEditor }) => {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (selectedElement) {
      setFormValues({ ...selectedElement });
    }
  }, [selectedElement]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: parseFloat(value),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedElement.type === 'sphere') {
      updateSphere(selectedElement.key, formValues);
    } else if (selectedElement.type === 'connection') {
      updateConnection(selectedElement.sphereKey, selectedElement.connectionKey, formValues);
    }
    closeEditor();
  };

  if (!selectedElement) return null;

  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'white', padding: '10px', border: '1px solid black' }}>
      <h3>Edit {selectedElement.type}</h3>
      <form onSubmit={handleSubmit}>
        {selectedElement.type === 'sphere' ? (
          <>
            <label>
              Mass:
              <input type="number" name="mass" value={formValues.mass || ''} onChange={handleChange} />
            </label>
            <br />
          </>
        ) : (
          <>
            <label>
              Length:
              <input type="number" name="length" value={formValues.length || ''} onChange={handleChange} />
            </label>
            <br />
            <label>
              Spring Constant:
              <input type="number" name="springConstant" value={formValues.springConstant || ''} onChange={handleChange} />
            </label>
            <br />
            <label>
              Damping Constant:
              <input type="number" name="dampingConstant" value={formValues.dampingConstant || ''} onChange={handleChange} />
            </label>
          </>
        )}
        <br />
        <button type="submit">Save</button>
        <button type="button" onClick={closeEditor}>Cancel</button>
      </form>
    </div>
  );
};

export default EditorPanel;
