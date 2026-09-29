const mmToPixels = (millimeters, ppi) => Math.round(millimeters / 25.4 * ppi);

const aSeries = [
  ['A0', 841, 1189, 80],
  ['A1', 594, 841, 100],
  ['A2', 420, 594, 120],
  ['A3', 297, 420, 180],
  ['A4', 210, 297, 200],
  ['A5', 148, 210, 210],
].map(([label, widthMm, heightMm, ppi]) => ({
  label,
  widthMm,
  heightMm,
  ppi,
  width: mmToPixels(widthMm, ppi),
  height: mmToPixels(heightMm, ppi),
  physical: `${widthMm}×${heightMm} mm`,
}));

const posterInches = [
  [8, 12, 200],
  [10, 15, 180],
  [11, 17, 180],
  [12, 18, 180],
  [14, 21, 180],
  [16, 24, 160],
  [20, 30, 120],
  [24, 36, 100],
  [27, 40, 90],
  [32, 48, 90],
].map(([widthInches, heightInches, ppi]) => ({
  label: `${widthInches}X${heightInches}`,
  widthInches,
  heightInches,
  ppi,
  width: widthInches * ppi,
  height: heightInches * ppi,
  physical: `${widthInches}×${heightInches} in`,
}));

export const PRINT_PRESETS = {
  a: aSeries,
  '2-3': posterInches,
};

export function getPrintPresets(template) {
  return PRINT_PRESETS[template === '2-3' ? '2-3' : 'a'];
}
