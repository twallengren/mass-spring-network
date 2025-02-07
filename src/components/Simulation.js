import React, { useMemo, useState, useEffect } from 'react';
import { Stage, Container } from '@pixi/react';
import { BlurFilter } from 'pixi.js';
import FullScreenStage from './FullScreenStage';
import EditorPanel from './EditorPanel';
import SphereGraphics from './SphereGraphics';
import ConnectionGraphics from './ConnectionGraphics';
import useWindowDimensions from '../utils/useWindowDimensions';
import { initializeSpheres } from '../utils/sphereUtils';
import { initializeConnections } from '../utils/connectionUtils';

const Simulation = ({ numSpheres = 20, maxNeighbors = 2 }) => {
  const blurFilter = useMemo(() => new BlurFilter(4), []);
  const dimensions = useWindowDimensions(window);
  const [draggedSphere, setDraggedSphere] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [spheres, setSpheres] = useState(() => initializeSpheres(numSpheres, dimensions.width, dimensions.height));
  const [connections, setConnections] = useState(() => initializeConnections(spheres, maxNeighbors));

  useEffect(() => {
    const update = () => {
      setSpheres((prevSpheres) => {
        const newSpheres = { ...prevSpheres };

        // Apply spring forces
        for (const key in connections) {
          const sphereKeys = key.split(',');
          const sphereA = newSpheres[sphereKeys[0]];
          const sphereB = newSpheres[sphereKeys[1]];

          const dx = sphereB.x - sphereA.x;
          const dy = sphereB.y - sphereA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const connection = connections[key];
          const springForce = connection.springConstant * (distance - connection.length);
          const fx = (springForce * dx) / distance;
          const fy = (springForce * dy) / distance;

          // Calculate relative velocity
          const relativeVx = sphereB.vx - sphereA.vx;
          const relativeVy = sphereB.vy - sphereA.vy;

          // Apply damping force
          const dampingForceX = connection.dampingConstant * relativeVx;
          const dampingForceY = connection.dampingConstant * relativeVy;

          // Total force
          const totalFx = fx + dampingForceX;
          const totalFy = fy + dampingForceY;

          sphereA.vx += totalFx / sphereA.mass;
          sphereA.vy += totalFy / sphereA.mass;
          sphereB.vx -= totalFx / sphereB.mass;
          sphereB.vy -= totalFy / sphereB.mass;
        }

        // Update positions and handle wall collisions
        for (const key in newSpheres) {
          let sphere = newSpheres[key];

          // Skip updating position if the sphere is being dragged
          if (draggedSphere === key) continue;

          // Skip updating position if the sphere is locked
          if (sphere.locked) continue;

          let newX = sphere.x + sphere.vx;
          let newY = sphere.y + sphere.vy;

          if (newX - sphere.radius < 0) {
            newX = sphere.radius;
            sphere.vx *= -1;
          } else if (newX + sphere.radius > dimensions.width) {
            newX = dimensions.width - sphere.radius;
            sphere.vx *= -1;
          }

          if (newY - sphere.radius < 0) {
            newY = sphere.radius;
            sphere.vy *= -1;
          } else if (newY + sphere.radius > dimensions.height) {
            newY = dimensions.height - sphere.radius;
            sphere.vy *= -1;
          }

          newSpheres[key] = {
            ...sphere,
            x: newX,
            y: newY,
          };
        }
        return newSpheres;
      });

      requestAnimationFrame(update);
    };

    const animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [dimensions, connections, draggedSphere]);

  const handlePointerDown = (key, event) => {
    setDraggedSphere(key);
  };

  const handlePointerMove = (event) => {
    if (draggedSphere) {
      setSpheres((prevSpheres) => ({
        ...prevSpheres,
        [draggedSphere]: {
          ...prevSpheres[draggedSphere],
          x: event.clientX,
          y: event.clientY,
          vx: 0, // Ensure velocity is reset while dragging
          vy: 0,
        },
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggedSphere(null);
  };

  const handleElementClick = (key, type, element) => {
    setSelectedElement({ key, type, ...element });
  };

  const handleDoubleClick = (key) => {
    setSpheres((prevSpheres) => ({
      ...prevSpheres,
      [key]: {
        ...prevSpheres[key],
        locked: !prevSpheres[key].locked, // Toggle locked state
      },
    }));
  };

  const updateSphere = (key, updatedValues) => {
    setSpheres((prevSpheres) => ({
      ...prevSpheres,
      [key]: {
        ...prevSpheres[key],
        ...updatedValues,
        radius: updatedValues.mass * 10, // Update radius based on mass
      },
    }));
  };

  const closeEditor = () => {
    setSelectedElement(null);
    setIsEditorOpen(false);
  };

  const handleStageClick = (event) => {
    const clickX = event.clientX;
    const clickY = event.clientY;
    for (const key in spheres) {
      const sphere = spheres[key];
      const dx = clickX - sphere.x;
      const dy = clickY - sphere.y;
      if (dx * dx + dy * dy <= sphere.radius * sphere.radius) {
        handleElementClick(key, 'sphere', sphere);
        return;
      }
    }
  };

  return (
    <FullScreenStage
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerDown={handleStageClick}
    >
      <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundColor: 0xffffff }}>
        <Container>
          {Object.keys(connections).map((key) => {
            const sphereKeys = key.split(',');
            const sphereA = spheres[sphereKeys[0]];
            const sphereB = spheres[sphereKeys[1]];
            return (
              <ConnectionGraphics
                key={key}
                connectionKey={key}
                sphereA={sphereA}
                sphereB={sphereB}
              />
            );
          })}
          {Object.keys(spheres).map((key) => {
            const sphere = spheres[key];
            return (
              <SphereGraphics
                key={key}
                sphereKey={key}
                sphere={sphere}
                handlePointerDown={handlePointerDown}
                handleElementClick={handleElementClick}
                handleDoubleClick={handleDoubleClick}
                blurFilter={blurFilter}
              />
            );
          })}
        </Container>
      </Stage>
      <button
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={() => setIsEditorOpen(true)}
      >
        Open Editor
      </button>
      {isEditorOpen && (
        <EditorPanel
          selectedElement={selectedElement}
          updateSphere={updateSphere}
          closeEditor={closeEditor}
        />
      )}
    </FullScreenStage>
  );
};

export default Simulation;
