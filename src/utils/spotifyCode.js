const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;

export function parseSpotifyAlbumId(value) {
  const input = value.trim();
  const uri = /^spotify:album:([A-Za-z0-9]{22})$/i.exec(input);
  if (uri) return uri[1];

  if (SPOTIFY_ID.test(input)) return input;

  try {
    const normalized = /^(?:open|play)\.spotify\.com\//i.test(input) ? `https://${input}` : input;
    const url = new URL(normalized);
    if (url.protocol !== 'https:' || !['open.spotify.com', 'play.spotify.com'].includes(url.hostname)) {
      return null;
    }
    const match = /^\/(?:intl-[a-z-]+\/)?album\/([A-Za-z0-9]{22})\/?$/i.exec(url.pathname);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function parseSpotifyPlaylistId(value) {
  const input = value.trim();
  const uri = /^spotify:playlist:([A-Za-z0-9]{22})$/i.exec(input);
  if (uri) return uri[1];
  if (SPOTIFY_ID.test(input)) return input;

  try {
    const normalized = /^(?:open|play)\.spotify\.com\//i.test(input) ? `https://${input}` : input;
    const url = new URL(normalized);
    if (url.protocol !== 'https:' || !['open.spotify.com', 'play.spotify.com'].includes(url.hostname)) return null;
    const match = /^\/(?:intl-[a-z-]+\/)?playlist\/([A-Za-z0-9]{22})\/?$/i.exec(url.pathname);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function recolorSpotifyCodeSvg(svg, contrast, textColor) {
  const foreground = contrast === 'black' ? '#000000' : '#ffffff';
  return svg.replaceAll(`fill="${foreground}"`, `fill="${textColor}"`);
}

export async function drawSpotifyCode(ctx, { albumId, playlistId, backgroundColor, textColor, x, y, width, height }) {
  const resource = SPOTIFY_ID.test(albumId || '') ? `album:${albumId}`
    : SPOTIFY_ID.test(playlistId || '') ? `playlist:${playlistId}` : null;
  if (!resource) return false;

  const hex = backgroundColor.replace('#', '');
  const rgb = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const luminance = rgb.map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  const contrast = 0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2] > 0.179 ? 'black' : 'white';
  const url = `https://scannables.scdn.co/uri/plain/svg/${hex}/${contrast}/640/spotify:${resource}`;
  let objectUrl;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    const svg = recolorSpotifyCodeSvg(await response.text(), contrast, textColor || (contrast === 'black' ? '#000000' : '#ffffff'));
    objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const image = await new Promise((resolve, reject) => {
      const loaded = new Image();
      const timer = setTimeout(() => {
        loaded.src = '';
        reject(new Error('Spotify code timed out'));
      }, 8000);
      loaded.onload = () => {
        clearTimeout(timer);
        resolve(loaded);
      };
      loaded.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Spotify code could not load'));
      };
      loaded.src = objectUrl;
    });
    ctx.drawImage(image, x, y, width, height);
    return true;
  } catch {
    return false;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
