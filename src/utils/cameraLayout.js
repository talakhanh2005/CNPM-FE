export const CAMERA_GAP = 16;

const ASPECT_RATIO = 16 / 9;
const MIN_TILE_WIDTH = 280;
const MAX_TILE_WIDTH = 1100;

export const calculateCameraColumns = (count) => {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 4) return 2;
  if (count <= 9) return 3;
  return 4;
};

export const calculateCameraMaxWidth = (count, columns, height) => {
  if (count <= 0 || columns <= 0 || height <= 0) return null;
  const rows = Math.ceil(count / columns);
  const availableTileHeight = Math.max(0, (height - CAMERA_GAP * (rows - 1)) / rows);
  const tileWidth = Math.min(MAX_TILE_WIDTH, Math.max(MIN_TILE_WIDTH, availableTileHeight * ASPECT_RATIO));
  return Math.floor(columns * tileWidth + CAMERA_GAP * (columns - 1));
};
