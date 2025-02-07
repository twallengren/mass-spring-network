import { Graphics } from '@pixi/react';

const ConnectionGraphics = ({ connectionKey, sphereA, sphereB }) => (
  <Graphics
    draw={(g) => {
      g.clear();
      g.lineStyle(1, 0x0000ff, 0.5);
      g.moveTo(sphereA.x, sphereA.y);
      g.lineTo(sphereB.x, sphereB.y);
    }}
    eventMode='none' // Update interactivity
  />
);

export default ConnectionGraphics;
