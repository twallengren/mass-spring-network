import styled from '@emotion/styled';
import { useMemo, useState, useEffect } from 'react';
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

const TestComponent = ({ numSpheres = 50 }) => {
  const blurFilter = useMemo(() => new BlurFilter(4), []);

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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
    return Array.from({ length: numSpheres }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 20 + 10,
    }));
  });

  useEffect(() => {
    const update = () => {
      setSpheres((prevSpheres) =>
        prevSpheres.map((sphere) => {
          let newX = sphere.x + sphere.vx;
          let newY = sphere.y + sphere.vy;

          if (newX < sphere.radius || newX > dimensions.width - sphere.radius) {
            sphere.vx *= -1;
          }
          if (newY < sphere.radius || newY > dimensions.height - sphere.radius) {
            sphere.vy *= -1;
          }

          return {
            ...sphere,
            x: newX,
            y: newY,
          };
        })
      );

      requestAnimationFrame(update);
    };

    const animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, [dimensions]);

  return (
    <FullScreenStage>
      <Stage width={dimensions.width} height={dimensions.height} options={{ backgroundColor: 0xffffff }}>
        <Container>
          {spheres.map((sphere, index) => (
            <Graphics
              key={index}
              draw={(g) => {
                g.clear();
                g.beginFill(0xff0000);
                g.drawCircle(0, 0, sphere.radius);
                g.endFill();
              }}
              x={sphere.x}
              y={sphere.y}
              filters={[blurFilter]}
            />
          ))}
        </Container>
      </Stage>
    </FullScreenStage>
  );
};

export default TestComponent;
