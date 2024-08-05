import styled from '@emotion/styled';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Stage, Container, Graphics } from '@pixi/react';
import { BlurFilter } from 'pixi.js';

const FullScreenStage = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  background-color: white;
`;

const TestComponent = ({ numSpheres = 5, maxNeighbors = 5 }) => {
  const blurFilter = useMemo(() => new BlurFilter(4), []);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [draggedSphere, setDraggedSphere] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [spheres, setSpheres] = useState(() => {
    const initialSpheres = {};
    for (let i = 0; i < numSpheres; i++) {
      const radius = Math.random() * 20 + 10;
      const key = `sphere_${i}`;
      initialSpheres[key] = {
        x: Math.random() * (window.innerWidth - 2 * radius) + radius,
        y: Math.random() * (window.innerHeight - 2 * radius) + radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: radius,
        mass: radius / 10, // Mass is proportional to the radius
      };
    }
    return initialSpheres;
  });

  const [connections, setConnections] = useState(() => {
    const calculateDistance = (a, b) => {
      return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    };

    const initialConnections = {};
    const sphereKeys = Object.keys(spheres);

    sphereKeys.forEach((key, i) => {
      const sphere = spheres[key];
      const distances = sphereKeys
        .filter((_, j) => i !== j)
        .map((otherKey) => ({
          key: otherKey,
          distance: calculateDistance(sphere, spheres[otherKey]),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, Math.floor(Math.random() * maxNeighbors) + 1);

      initialConnections[key] = distances.map((d) => ({
        key: d.key,
        length: d.distance,
        springConstant: Math.random() * 0.01 + 0.01, // random spring constant between 0.01 and 0.06
        dampingConstant: Math.random() * 0.001 + 0.00001, // random damping constant between 0.01 and 0.03
      }));
    });

    return initialConnections;
  });

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

  return (
    <FullScreenStage
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundColor: 0xffffff }}>
        <Container>
          {Object.keys(connections).map((key) => {
            const sphere = spheres[key];
            return connections[key].map((connection) => {
              const neighbor = spheres[connection.key];
              return (
                <Graphics
                  key={`${key}_${connection.key}`}
                  draw={(g) => {
                    g.clear();
                    g.lineStyle(1, 0x0000ff, 0.5);
                    g.moveTo(sphere.x, sphere.y);
                    g.lineTo(neighbor.x, neighbor.y);
                  }}
                />
              );
            });
          })}
          {Object.keys(spheres).map((key) => {
            const sphere = spheres[key];
            return (
              <Graphics
                key={key}
                draw={(g) => {
                  g.clear();
                  g.beginFill(0xff0000);
                  g.drawCircle(0, 0, sphere.radius);
                  g.endFill();
                }}
                x={sphere.x}
                y={sphere.y}
                filters={[blurFilter]}
                interactive
                pointerdown={(e) => handlePointerDown(key, e)}
              />
            );
          })}
        </Container>
      </Stage>
    </FullScreenStage>
  );
};

export default TestComponent;
