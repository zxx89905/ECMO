import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeJpegWithDpi } from './jpegPrint.js';

test('JPEG print export writes the selected inch density', async () => {
  const source = new Uint8Array([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
    0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02, 0x00,
    0x00, 0x60, 0x00, 0x60, 0x00, 0x00,
    0xff, 0xd9,
  ]);
  const canvas = { toBlob: (callback) => callback(new Blob([source], { type: 'image/jpeg' })) };
  const result = new Uint8Array(await (await encodeJpegWithDpi(canvas, 210)).arrayBuffer());
  assert.equal(result[13], 1);
  assert.deepEqual(Array.from(result.subarray(14, 18)), [0, 210, 0, 210]);
});
