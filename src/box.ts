export type Box = {
  x: number;
  y: number;
  size: number;
};

export function boxIntersect(a: Box, b: Box) {
  const ax = a.x - 0.5 * a.size;
  const ay = a.y - 0.5 * a.size;
  const bx = b.x - 0.5 * b.size;
  const by = b.y - 0.5 * b.size;
  return (
    ax < bx + b.size && ax + a.size > bx && ay < by + b.size && ay + a.size > by
  );
}

export function boxContains(a: Box, b: Box) {
  const ax = a.x - 0.5 * a.size;
  const ay = a.y - 0.5 * a.size;
  const bx = b.x - 0.5 * b.size;
  const by = b.y - 0.5 * b.size;
  return (
    bx > ax && bx + b.size < ax + a.size && by > ay && by + b.size < ay + a.size
  );
}
