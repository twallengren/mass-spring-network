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

const Simulation = ({ numSpheres = 50, maxNeighbors = 3 }) => {
  const blurFilter = useMemo(() => new BlurFilter(4), []);
  const dimensions = useWindowDimensions(window);
  const [draggedSphere, setDraggedSphere] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState(null);

  const [spheres, setSpheres] = useState(() => initializeSpheres(numSpheres, dimensions.width, dimensions.height));
  const [connections, setConnections] = useState(() => initializeConnections(spheres, maxNeighbors));

  useEffect(() => {
    const update = () => {
      setSpheres((prevSpheres) => {
        const newSpheres = { ...prevSpheres };

        // Apply spring forces
        for (const key in connections) {
          const sphere = newSpheres[key];
          connections[key].forEach((connection) => {
            const neighbor = newSpheres[connection.key];
            const dx = neighbor.x - sphere.x;
            const dy = neighbor.y - sphere.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const springForce = connection.springConstant * (distance - connection.length);
            const fx = (springForce * dx) / distance;
            const fy = (springForce * dy) / distance;

            // Calculate relative velocity
            const relativeVx = neighbor.vx - sphere.vx;
            const relativeVy = neighbor.vy - sphere.vy;

            // Apply damping force
            const dampingForceX = connection.dampingConstant * relativeVx;
            const dampingForceY = connection.dampingConstant * relativeVy;

            // Total force
            const totalFx = fx + dampingForceX;
            const totalFy = fy + dampingForceY;

            // Update velocities considering masses
            sphere.vx += totalFx / sphere.mass;
            sphere.vy += totalFy / sphere.mass;
            neighbor.vx -= totalFx / neighbor.mass;
            neighbor.vy -= totalFy / neighbor.mass;
          });
        }

        // Update positions and handle wall collisions
        for (const key in newSpheres) {
          let sphere = newSpheres[key];

          // Skip updating position if the sphere is being dragged
          if (draggedSphere === key) continue;

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
    setDragOffset({
      x: event.clientX - spheres[key].x,
      y: event.clientY - spheres[key].y,
    });
  };

  const handlePointerMove = (event) => {
    if (draggedSphere) {
      setSpheres((prevSpheres) => ({
        ...prevSpheres,
        [draggedSphere]: {
          ...prevSpheres[draggedSphere],
          x: event.clientX - dragOffset.x,
          y: event.clientY - dragOffset.y,
          vx: 0, // Reset velocity while dragging
          vy: 0, // Reset velocity while dragging
        },
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggedSphere(null);
  };

  const handleElementClick = (key, type, element, connectionKey = null) => {
    setSelectedElement({ key, type, ...element });
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

  const updateConnection = (sphereKey, connectionKey, updatedValues) => {
    setConnections((prevConnections) => ({
      ...prevConnections,
      [sphereKey]: prevConnections[sphereKey].map((connection) =>
        connection.connectionKey === connectionKey
          ? { ...connection, ...updatedValues }
          : connection
      ),
    }));
  };

  const closeEditor = () => {
    setSelectedElement(null);
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
            const sphere = spheres[key];
            return connections[key].map((connection) => {
              const neighbor = spheres[connection.key];
              return (
                <ConnectionGraphics
                  key={connection.connectionKey}
                  connectionKey={connection.connectionKey}
                  sphere={sphere}
                  connection={connection}
                  neighbor={neighbor}
                />
              );
            });
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
                blurFilter={blurFilter}
              />
            );
          })}
        </Container>
      </Stage>
      <EditorPanel
        selectedElement={selectedElement}
        updateSphere={updateSphere}
        updateConnection={updateConnection}
        closeEditor={closeEditor}
      />
    </FullScreenStage>
  );
};

export default Simulation;
