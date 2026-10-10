import test from 'node:test';
import assert from 'node:assert/strict';
import { findHighResolutionCover } from './highResolutionCover.js';

const album = (name) => ({ name, artists: [{ name: 'Test Artist' }], images: [{ width: 640, height: 640 }] });
const searchResponse = (name, artist = 'Test Artist') => ({ ok: true, json: async () => ({ results: [{
  collectionName: name, artistName: artist,
  artworkUrl100: 'https://is1-ssl.mzstatic.com/image/thumb/Music/test.jpg/100x100bb.jpg',
}] }) });
const coverResponse = { ok: true, blob: async () => new Blob(['image'], { type: 'image/jpeg' }) };

function mockImage(context, width = 3000, stalled = false) {
  const revoked = [];
  class TestImage {
    naturalWidth = width;
    naturalHeight = width;
    set src(value) { if (value && !stalled) queueMicrotask(() => this.onload?.()); }
    removeAttribute() {}
  }
  context.mock.method(URL, 'createObjectURL', () => 'blob:test');
  context.mock.method(URL, 'revokeObjectURL', (url) => revoked.push(url));
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  Object.defineProperty(globalThis, 'Image', { configurable: true, writable: true, value: TestImage });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, 'Image', previous);
    else delete globalThis.Image;
  });
  return revoked;
}

test('no match returns immediately without downloading a cover', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ results: [] }) }));
  assert.equal((await findHighResolutionCover(album('missing'))).status, 'unavailable');
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('a different artist or album is not treated as an available cover', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => searchResponse('same name', 'Someone Else'));
  assert.equal((await findHighResolutionCover(album('same name'))).status, 'unavailable');
  context.mock.method(globalThis, 'fetch', async () => searchResponse('wrong album'));
  assert.equal((await findHighResolutionCover(album('wanted album'))).status, 'unavailable');
});

test('404 original artwork disables the high resolution option', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url) => url.includes('itunes.apple.com')
    ? searchResponse('deleted artwork') : { ok: false, status: 404 });
  assert.equal((await findHighResolutionCover(album('deleted artwork'))).status, 'unavailable');
});

test('only a decoded cover larger than the standard image is available and cached', async (context) => {
  const revoked = mockImage(context);
  const fetchMock = context.mock.method(globalThis, 'fetch', async (url) => url.includes('itunes.apple.com')
    ? searchResponse('large artwork') : coverResponse);
  const result = await findHighResolutionCover(album('large artwork'));
  assert.equal(result.status, 'available');
  assert.equal(result.width, 3000);
  assert.ok(result.blob instanceof Blob);
  assert.equal(await findHighResolutionCover(album('large artwork')), result);
  assert.equal(fetchMock.mock.callCount(), 2);
  assert.deepEqual(revoked, ['blob:test']);
});

test('an original image no larger than Spotify is not advertised as HD', async (context) => {
  mockImage(context, 640);
  context.mock.method(globalThis, 'fetch', async (url) => url.includes('itunes.apple.com')
    ? searchResponse('small artwork') : coverResponse);
  assert.equal((await findHighResolutionCover(album('small artwork'))).status, 'unavailable');
});

test('network errors remain retryable instead of being cached as missing', async (context) => {
  const fetchMock = context.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  assert.equal((await findHighResolutionCover(album('network failure'))).status, 'error');
  assert.equal((await findHighResolutionCover(album('network failure'))).status, 'error');
  assert.equal(fetchMock.mock.callCount(), 2);
});

test('stalled fetch is bounded even if the fetch implementation ignores abort', async (context) => {
  context.mock.method(globalThis, 'fetch', () => new Promise(() => {}));
  assert.equal((await findHighResolutionCover(album('stalled search'), { timeoutMs: 20 })).status, 'timeout');
});

test('stalled image decoding is bounded and its object URL is released', async (context) => {
  const revoked = mockImage(context, 3000, true);
  context.mock.method(globalThis, 'fetch', async (url) => url.includes('itunes.apple.com')
    ? searchResponse('stalled decode') : coverResponse);
  assert.equal((await findHighResolutionCover(album('stalled decode'), { timeoutMs: 20 })).status, 'timeout');
  assert.deepEqual(revoked, ['blob:test']);
});

test('leaving an album cancels a pending check instead of reporting missing', async (context) => {
  context.mock.method(globalThis, 'fetch', () => new Promise(() => {}));
  const controller = new AbortController();
  const pending = findHighResolutionCover(album('cancelled'), { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
