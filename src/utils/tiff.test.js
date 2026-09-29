import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeTiff } from './tiff.js';

test('encodes RGB pixels with dimensions and print resolution', async () => {
  const canvas = {
    width: 2,
    height: 2,
    getContext: () => ({ getImageData: () => ({ data: Uint8ClampedArray.from([
      255, 0, 0, 255, 0, 255, 0, 255,
      0, 0, 255, 255, 255, 255, 255, 255,
    ]) }) }),
  };
  const blob = await encodeTiff(canvas, 300);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(blob.type, 'image/tiff');
  assert.equal(view.getUint16(0, true), 0x4949);
  assert.equal(view.getUint16(2, true), 42);
  const entries = new Map();
  for (let i = 0; i < view.getUint16(8, true); i++) {
    const at = 10 + i * 12;
    entries.set(view.getUint16(at, true), view.getUint32(at + 8, true));
  }
  assert.equal(entries.get(256), 2);
  assert.equal(entries.get(257), 2);
  assert.equal(entries.get(296) & 0xffff, 2);
  assert.equal(view.getUint32(entries.get(282), true), 300);
  assert.deepEqual(Array.from(bytes.subarray(entries.get(273), entries.get(273) + 12)), [
    255, 0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255,
  ]);
});
