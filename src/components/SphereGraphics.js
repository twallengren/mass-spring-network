import { Graphics } from '@pixi/react';

const SphereGraphics = ({ sphereKey, sphere, handlePointerDown, handleElementClick, handleDoubleClick, blurFilter }) => (
  <Graphics
    draw={(g) => {
      g.clear();
      g.beginFill(0xff0000);
      g.drawCircle(0, 0, sphere.radius);
      g.endFill();
    }}
    x={sphere.x}
    y={sphere.y}
    filters={[blurFilter]}
    eventMode='dynamic'
    pointerdown={(e) => handlePointerDown(sphereKey, e)}
    pointerup={() => handleElementClick(sphereKey, 'sphere', sphere)}
    pointertap={(e) => e.detail === 2 && handleDoubleClick(sphereKey)}
  />
);

export default SphereGraphics;
