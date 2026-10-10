const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

const normalize = (value = '') => value.normalize('NFKD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function originalArtwork(url) {
  if (!url) return '';
  const parts = url.split('/image/thumb/');
  return parts.length === 2
    ? `https://a5.mzstatic.com/us/r1000/0/${parts[1].split('/').slice(0, -1).join('/')}`
    : '';
}

function decodeCover(blob, signal) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    const finish = (error) => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener('abort', abort);
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      image.removeAttribute('src');
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve(size);
    };
    const abort = () => finish(signal.reason);
    image.onload = () => finish();
    image.onerror = () => finish(new Error('Invalid cover image'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    else image.src = url;
  });
}

// The deadline includes searching, downloading and decoding, so a stalled image
// cannot hold the editor open. Cache blobs, not object URLs owned by a component.
export async function findHighResolutionCover(album, { signal, timeoutMs = 6000 } = {}) {
  signal?.throwIfAborted();
  const sourceSize = Math.max(640, ...((album.images || []).map((image) => Math.max(image.width || 0, image.height || 0))));
  const key = JSON.stringify([album.name, album.artists?.map((artist) => artist.name), sourceSize]);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < CACHE_TTL) return cached.result;
  cache.delete(key);

  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => controller.abort(new DOMException('Cover check timed out', 'TimeoutError')), timeoutMs);
  let rejectAbort;
  const aborted = new Promise((resolve, reject) => { rejectAbort = reject; });
  const onAbort = () => rejectAbort(controller.signal.reason);
  controller.signal.addEventListener('abort', onAbort, { once: true });

  const check = async () => {
    const artist = album.artists?.[0]?.name || '';
    const params = new URLSearchParams({ term: `${album.name} ${artist}`, country: 'us', entity: 'album', limit: '8' });
    const response = await fetch(`https://itunes.apple.com/search?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Cover search: ${response.status}`);
    const data = await response.json();
    const match = data.results?.find((result) => normalize(result.collectionName) === normalize(album.name)
      && artist && normalize(result.artistName) === normalize(artist));
    const source = originalArtwork(match?.artworkUrl100);
    if (!source) return { status: 'unavailable' };

    const coverResponse = await fetch(source, { signal: controller.signal });
    if (coverResponse.status === 404 || coverResponse.status === 410) return { status: 'unavailable' };
    if (!coverResponse.ok) throw new Error(`Cover download: ${coverResponse.status}`);
    const blob = await coverResponse.blob();
    if (!blob.type.startsWith('image/')) throw new Error('Invalid cover response');
    const size = await decodeCover(blob, controller.signal);
    if (Math.min(size.width, size.height) <= sourceSize) return { status: 'unavailable' };
    return { status: 'available', blob, ...size };
  };

  try {
    const result = await Promise.race([check(), aborted]);
    controller.signal.throwIfAborted();
    if (cache.size >= 20) cache.delete(cache.keys().next().value);
    cache.set(key, { time: Date.now(), result });
    return result;
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    return { status: error?.name === 'TimeoutError' ? 'timeout' : 'error' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', onAbort);
  }
}
