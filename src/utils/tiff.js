const TYPE_SHORT = 3;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;
const align4 = (value) => (value + 3) & ~3;

// Baseline, uncompressed RGB TIFF. Read pixels in strips so large posters do not
// require a second full-size RGBA buffer in memory.
export async function encodeTiff(canvas, ppi) {
  const width = canvas.width;
  const height = canvas.height;
  const context = canvas.getContext('2d');
  if (!width || !height || !context || !Number.isFinite(ppi) || ppi <= 0) {
    throw new Error('Invalid TIFF dimensions or resolution');
  }

  const rowsPerStrip = Math.min(64, height);
  const stripCount = Math.ceil(height / rowsPerStrip);
  const byteCounts = Array.from({ length: stripCount }, (_, index) =>
    width * Math.min(rowsPerStrip, height - index * rowsPerStrip) * 3);
  const entryCount = 14;
  const ifdEnd = 8 + 2 + entryCount * 12 + 4;
  const bitsOffset = ifdEnd;
  let nextOffset = align4(bitsOffset + 6);
  const offsetsArray = stripCount > 1 ? nextOffset : 0;
  if (offsetsArray) nextOffset += stripCount * 4;
  const countsArray = stripCount > 1 ? nextOffset : 0;
  if (countsArray) nextOffset += stripCount * 4;
  const xResolutionOffset = nextOffset;
  const yResolutionOffset = xResolutionOffset + 8;
  const pixelOffset = align4(yResolutionOffset + 8);

  const stripOffsets = [];
  let runningOffset = pixelOffset;
  for (const count of byteCounts) {
    stripOffsets.push(runningOffset);
    runningOffset += count;
  }
  if (runningOffset > 0xffffffff) throw new Error('TIFF exceeds the classic 4 GB limit');

  const header = new Uint8Array(pixelOffset);
  const view = new DataView(header.buffer);
  view.setUint16(0, 0x4949, true);
  view.setUint16(2, 42, true);
  view.setUint32(4, 8, true);
  view.setUint16(8, entryCount, true);

  let position = 10;
  const entry = (tag, type, count, value) => {
    view.setUint16(position, tag, true);
    view.setUint16(position + 2, type, true);
    view.setUint32(position + 4, count, true);
    if (type === TYPE_SHORT && count === 1) view.setUint16(position + 8, value, true);
    else view.setUint32(position + 8, value, true);
    position += 12;
  };

  entry(256, TYPE_LONG, 1, width);
  entry(257, TYPE_LONG, 1, height);
  entry(258, TYPE_SHORT, 3, bitsOffset);
  entry(259, TYPE_SHORT, 1, 1);
  entry(262, TYPE_SHORT, 1, 2);
  entry(273, TYPE_LONG, stripCount, offsetsArray || stripOffsets[0]);
  entry(274, TYPE_SHORT, 1, 1);
  entry(277, TYPE_SHORT, 1, 3);
  entry(278, TYPE_LONG, 1, rowsPerStrip);
  entry(279, TYPE_LONG, stripCount, countsArray || byteCounts[0]);
  entry(282, TYPE_RATIONAL, 1, xResolutionOffset);
  entry(283, TYPE_RATIONAL, 1, yResolutionOffset);
  entry(284, TYPE_SHORT, 1, 1);
  entry(296, TYPE_SHORT, 1, 2);
  view.setUint32(position, 0, true);

  for (let index = 0; index < 3; index++) view.setUint16(bitsOffset + index * 2, 8, true);
  if (offsetsArray) {
    stripOffsets.forEach((offset, index) => view.setUint32(offsetsArray + index * 4, offset, true));
    byteCounts.forEach((count, index) => view.setUint32(countsArray + index * 4, count, true));
  }
  view.setUint32(xResolutionOffset, Math.round(ppi), true);
  view.setUint32(xResolutionOffset + 4, 1, true);
  view.setUint32(yResolutionOffset, Math.round(ppi), true);
  view.setUint32(yResolutionOffset + 4, 1, true);

  const parts = [header];
  for (let strip = 0; strip < stripCount; strip++) {
    const y = strip * rowsPerStrip;
    const rows = Math.min(rowsPerStrip, height - y);
    const rgba = context.getImageData(0, y, width, rows).data;
    const rgb = new Uint8Array(byteCounts[strip]);
    for (let source = 0, target = 0; source < rgba.length; source += 4) {
      const alpha = rgba[source + 3] / 255;
      rgb[target++] = Math.round(rgba[source] * alpha + 255 * (1 - alpha));
      rgb[target++] = Math.round(rgba[source + 1] * alpha + 255 * (1 - alpha));
      rgb[target++] = Math.round(rgba[source + 2] * alpha + 255 * (1 - alpha));
    }
    parts.push(rgb);
    if (strip % 8 === 7) await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return new Blob(parts, { type: 'image/tiff' });
}
