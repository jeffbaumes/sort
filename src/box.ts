export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function boxIntersect(a: Box, b: Box) {
  const ax = a.x - 0.5 * a.width;
  const ay = a.y - 0.5 * a.height;
  const bx = b.x - 0.5 * b.width;
  const by = b.y - 0.5 * b.height;
  return (
    ax < bx + b.width &&
    ax + a.width > bx &&
    ay < by + b.height &&
    ay + a.height > by
  );
}

export function boxContains(a: Box, b: Box) {
  const ax = a.x - 0.5 * a.width;
  const ay = a.y - 0.5 * a.height;
  const bx = b.x - 0.5 * b.width;
  const by = b.y - 0.5 * b.height;
  return (
    bx > ax &&
    bx + b.width < ax + a.width &&
    by > ay &&
    by + b.height < ay + a.height
  );
}
