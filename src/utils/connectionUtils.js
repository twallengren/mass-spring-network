export const initializeConnections = (spheres, maxNeighbors) => {
  const calculateDistance = (a, b) => {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  };

  const initialConnections = {};
  const sphereKeys = Object.keys(spheres);

  sphereKeys.forEach((key, i) => {
    const sphere = spheres[key];
    const closestNeighbors = sphereKeys
      .filter((_, j) => i !== j)
      .map((otherKey) => ({
        key: otherKey,
        distance: calculateDistance(sphere, spheres[otherKey]),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.floor(Math.random() * maxNeighbors) + 1)
      .map(k => k.key);

    for (const neighborKey of closestNeighbors) {
      const connectionKey = key < neighborKey ? `${key},${neighborKey}` : `${neighborKey},${key}`;
      initialConnections[connectionKey] = {
        connectionKey,
        key: connectionKey,
        length: Math.random() * 2 * calculateDistance(sphere, spheres[neighborKey]),
        springConstant: Math.random() * 0.001 + 0.0001,
        dampingConstant: Math.random() * 0.001 + 0.001,
      };
    }
  });

  return initialConnections;
};
