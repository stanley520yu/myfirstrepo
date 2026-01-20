export function randomInt(max) {
  if (!Number.isFinite(max) || max <= 0) {
    throw new Error("max must be a positive number");
  }
  const maxUint32 = 0xffffffff;
  const bucketSize = Math.floor((maxUint32 + 1) / max);
  const limit = bucketSize * max;
  const uint32 = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(uint32);
    value = uint32[0];
  } while (value >= limit);
  return Math.floor(value / bucketSize);
}
