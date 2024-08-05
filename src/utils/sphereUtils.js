export const initializeSpheres = (numSpheres, width, height) => {
  const initialSpheres = {};
  for (let i = 0; i < numSpheres; i++) {
    const radius = Math.random() * 30 + 20;
    const key = `sphere_${i}`;
    initialSpheres[key] = {
      x: Math.random() * (width - 2 * radius) + radius,
      y: Math.random() * (height - 2 * radius) + radius,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: radius,
      mass: radius / 10, // Mass is proportional to the radius
    };
  }
  return initialSpheres;
};
