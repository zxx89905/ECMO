// Download once so palette extraction and poster rendering use the same local image.
export async function loadManualCover(artwork, thumbnail, signal) {
  const candidates = [...new Set([artwork, thumbnail].filter(Boolean))];
  for (const source of candidates) {
    let objectUrl;
    try {
      const requestSignal = AbortSignal.any([signal, AbortSignal.timeout(7000)].filter(Boolean));
      const response = await fetch(source, { signal: requestSignal });
      if (!response.ok) throw new Error('Cover unavailable');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Invalid cover');
      objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      if (signal?.aborted) throw signal.reason;
      return { url: objectUrl, fallback: source !== artwork };
    } catch (error) {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      if (signal?.aborted) throw error;
    }
  }
  return { url: '', fallback: false };
}
