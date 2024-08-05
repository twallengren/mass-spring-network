import { Graphics } from '@pixi/react';

const ConnectionGraphics = ({ connectionKey, sphere, connection, neighbor }) => (
  <Graphics
    draw={(g) => {
      g.clear();
      g.lineStyle(1, 0x0000ff, 0.5);
      g.moveTo(sphere.x, sphere.y);
      g.lineTo(neighbor.x, neighbor.y);
    }}
    eventMode='none' // Update interactivity
  />
);

export default ConnectionGraphics;
