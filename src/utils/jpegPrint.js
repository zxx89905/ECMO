const JFIF_HEADER = [0x4a, 0x46, 0x49, 0x46, 0x00];

export async function encodeJpegWithDpi(canvas, ppi) {
  if (!Number.isInteger(ppi) || ppi < 1 || ppi > 65535) {
    throw new Error('Invalid JPEG print resolution');
  }

  const jpeg = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('JPEG export failed')), 'image/jpeg', 0.95);
  });
  const bytes = new Uint8Array(await jpeg.arrayBuffer());
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Canvas did not produce a JPEG');

  let position = 2;
  while (position + 4 < bytes.length && bytes[position] === 0xff) {
    const marker = bytes[position + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[position + 2] << 8) | bytes[position + 3];
    if (length < 2 || position + 2 + length > bytes.length) throw new Error('Invalid JPEG segment');
    const payload = position + 4;
    if (marker === 0xe0 && length >= 16 && JFIF_HEADER.every((byte, index) => bytes[payload + index] === byte)) {
      bytes[payload + 7] = 1; // density unit: inches
      bytes[payload + 8] = ppi >> 8;
      bytes[payload + 9] = ppi & 0xff;
      bytes[payload + 10] = ppi >> 8;
      bytes[payload + 11] = ppi & 0xff;
      return new Blob([bytes], { type: 'image/jpeg' });
    }
    position += 2 + length;
  }

  const jfif = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10,
    ...JFIF_HEADER, 0x01, 0x02, 0x01,
    ppi >> 8, ppi & 0xff, ppi >> 8, ppi & 0xff,
    0x00, 0x00,
  ]);
  return new Blob([bytes.subarray(0, 2), jfif, bytes.subarray(2)], { type: 'image/jpeg' });
}
