import { parseSpotifyPlaylistId } from '../utils/spotifyCode.js';

export const MAX_SAVED_PLAYLIST_ITEMS = 50;

function parseClock(value) {
  const parts = value.trim().split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isInteger(part))) return null;
  if (parts.slice(1).some((part) => part < 0 || part >= 60)) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseWrittenDuration(value) {
  const hour = /(?:^|\D)(\d+)\s*(?:小时|hours?|hrs?)/i.exec(value);
  const minute = /(?:^|\D)(\d+)\s*(?:分钟|mins?|minutes?)/i.exec(value);
  const second = /(?:^|\D)(\d+)\s*(?:秒|secs?|seconds?)/i.exec(value);
  if (!hour && !minute && !second) return null;
  return Number(hour?.[1] || 0) * 3600 + Number(minute?.[1] || 0) * 60 + Number(second?.[1] || 0);
}

function formatRuntime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}h ${minutes}min ${seconds}s` : `${minutes}min ${seconds}s`;
}

function playlistCover(document) {
  const image = document.querySelector('[data-testid="playlist-image"] img');
  if (!image) return '';
  const candidates = (image.getAttribute('srcset') || '').split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .concat(image.getAttribute('src') || '');
  for (const candidate of candidates.reverse()) {
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'https:' || !/(?:^|\.)(?:scdn\.co|spotifycdn\.com)$/.test(url.hostname)) continue;
      if (url.hostname === 'mosaic.scdn.co') url.pathname = url.pathname.replace(/^\/300\//, '/640/');
      return url.href;
    } catch {
      // Chrome rewrites Spotify image URLs to paths in the companion _files folder.
      const imageId = /(?:^|\/)([a-f0-9]{40})(?:[?#].*)?$/i.exec(candidate)?.[1];
      if (imageId) return `https://i.scdn.co/image/${imageId}`;
    }
  }
  return '';
}

function savedPlaylistLink(html) {
  const savedFrom = /saved from url=\([^)]*\)(https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]{22})/i.exec(html);
  const matched = savedFrom?.[1] || /https:\/\/open\.spotify\.com\/playlist\/[A-Za-z0-9]{22}/i.exec(html)?.[0];
  const id = matched ? parseSpotifyPlaylistId(matched) : null;
  return id ? `https://open.spotify.com/playlist/${id}` : '';
}

export function parseSavedSpotifyPlaylistHtml(html) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('SAVED_PLAYLIST_INVALID');
  const document = new DOMParser().parseFromString(html, 'text/html');
  const grid = document.querySelector('[data-testid="playlist-tracklist"]');
  if (!grid) throw new Error('SAVED_PLAYLIST_INVALID');

  const rows = [...grid.querySelectorAll('[data-testid="tracklist-row"]')];
  const ariaRowCount = Number(grid.getAttribute('aria-rowcount'));
  const countText = [...document.querySelectorAll('span')].find((span) =>
    /^\d+\s*(?:首歌曲|songs?|tracks?)$/i.test(span.textContent.trim()));
  const listedCount = countText ? Number.parseInt(countText.textContent, 10) : null;
  const expectedCount = Number.isInteger(ariaRowCount) && ariaRowCount > 1 ? ariaRowCount - 1 : listedCount;
  if (!Number.isInteger(expectedCount) || expectedCount < 1) throw new Error('SAVED_PLAYLIST_COUNT_UNKNOWN');
  if (expectedCount > MAX_SAVED_PLAYLIST_ITEMS) throw new Error('PLAYLIST_TOO_LONG');
  if (rows.length !== expectedCount) throw new Error('SAVED_PLAYLIST_INCOMPLETE');

  const songs = rows.map((row) => {
    const title = row.querySelector('a[href*="/track/"]')?.textContent.trim();
    const durationText = row.querySelector('[role="gridcell"][aria-colindex="5"]')?.textContent.trim();
    const duration = durationText ? parseClock(durationText) : null;
    if (!title || duration === null) throw new Error('SAVED_PLAYLIST_INCOMPLETE');
    return { title, duration };
  });
  const publishedDuration = countText ? parseWrittenDuration(countText.parentElement?.textContent || '') : null;
  const totalSeconds = publishedDuration ?? songs.reduce((sum, song) => sum + song.duration, 0);
  const name = grid.getAttribute('aria-label')?.trim() || document.title.replace(/\s*-\s*playlist by .*$/i, '').trim();
  if (!name) throw new Error('SAVED_PLAYLIST_INVALID');

  return {
    name,
    artist: document.querySelector('[data-testid="creator-link"]')?.textContent.trim() || '',
    artwork: playlistCover(document),
    releaseDate: '',
    runtime: formatRuntime(totalSeconds),
    tracklist: songs.map((song, index) => `${index + 1}. ${song.title}`).join('\n'),
    trackCount: songs.length,
    durationEstimated: publishedDuration === null,
    source: 'spotify-saved-page',
    spotifyLink: savedPlaylistLink(html),
  };
}
