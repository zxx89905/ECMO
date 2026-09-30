import { parseSpotifyAlbumId, parseSpotifyPlaylistId } from '../utils/spotifyCode.js';

export const MAX_SAVED_SPOTIFY_ITEMS = 50;

function parseClock(value) {
  if (!/^\d+:\d{2}(?::\d{2})?$/.test(value.trim())) return null;
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
  return {
    seconds: Number(hour?.[1] || 0) * 3600 + Number(minute?.[1] || 0) * 60 + Number(second?.[1] || 0),
    precision: second ? 'second' : minute ? 'minute' : 'hour',
  };
}

function formatRuntime(totalSeconds, precision = 'second') {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (precision === 'hour') return `${hours}h`;
  const value = hours ? `${hours}h ${minutes}min` : `${minutes}min`;
  return precision === 'minute' ? value : `${value} ${seconds}s`;
}

function pageCover(document, isAlbum) {
  const image = document.querySelector(isAlbum
    ? '[data-testid="entity-header"] img'
    : '[data-testid="playlist-image"] img');
  if (!image) return '';
  const candidates = (image.getAttribute('srcset') || '').split(',')
    .map((entry) => entry.trim().split(/\s+/))
    .sort((a, b) => Number.parseInt(b[1] || '0', 10) - Number.parseInt(a[1] || '0', 10))
    .map(([url]) => url)
    .concat(image.getAttribute('src') || '');
  for (const candidate of candidates) {
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

function savedPageLink(html, document, type) {
  const savedFrom = /saved from url=\([^)]*\)(https:\/\/open\.spotify\.com\/[^\s<>]+)/i.exec(html)?.[1];
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
  const parseId = type === 'album' ? parseSpotifyAlbumId : parseSpotifyPlaylistId;
  const id = [savedFrom, canonical].filter(Boolean).map(parseId).find(Boolean);
  return id ? `https://open.spotify.com/${type}/${id}` : '';
}

function albumReleaseDate(document) {
  for (const element of document.querySelectorAll('p')) {
    const value = element.textContent.trim();
    const numeric = /^(\d{4})(?:年|-)(\d{1,2})(?:月|-)(\d{1,2})日?$/.exec(value);
    if (numeric) return `${numeric[1]}-${numeric[2].padStart(2, '0')}-${numeric[3].padStart(2, '0')}`;
    if (/^(?:[A-Za-z]+ \d{1,2},? \d{4}|\d{1,2} [A-Za-z]+ \d{4})$/.test(value)) {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
    }
  }
  return document.querySelector('[data-testid="release-date"]')?.textContent.trim() || '';
}

export function parseSavedSpotifyPageHtml(html) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('SAVED_PLAYLIST_INVALID');
  const document = new DOMParser().parseFromString(html, 'text/html');
  const albumPage = document.querySelector('[data-testid="album-page"]');
  const isAlbum = Boolean(albumPage);
  const page = albumPage || document;
  const grid = page.querySelector(isAlbum ? '[data-testid="track-list"]' : '[data-testid="playlist-tracklist"]');
  if (!grid) throw new Error('SAVED_PLAYLIST_INVALID');

  const rows = [...grid.querySelectorAll('[data-testid="tracklist-row"]')];
  const ariaRowCount = Number(grid.getAttribute('aria-rowcount'));
  const countText = [...page.querySelectorAll('span')].find((span) =>
    /^\d+\s*(?:首歌曲|songs?|tracks?)$/i.test(span.textContent.trim()));
  const listedCount = countText ? Number.parseInt(countText.textContent, 10) : null;
  const expectedCount = Number.isInteger(ariaRowCount) && ariaRowCount > 1 ? ariaRowCount - 1 : listedCount;
  if (!Number.isInteger(expectedCount) || expectedCount < 1) throw new Error('SAVED_PLAYLIST_COUNT_UNKNOWN');
  if (expectedCount > MAX_SAVED_SPOTIFY_ITEMS) throw new Error('PLAYLIST_TOO_LONG');
  if (rows.length !== expectedCount) throw new Error('SAVED_PLAYLIST_INCOMPLETE');

  const songs = rows.map((row) => {
    const title = row.querySelector('a[href*="/track/"]')?.textContent.trim();
    const durationCell = [...row.querySelectorAll('[role="gridcell"]')].at(-1);
    const durationText = durationCell ? [...durationCell.querySelectorAll('div, span')]
      .map((element) => element.textContent.trim()).find((value) => /^\d+:\d{2}(?::\d{2})?$/.test(value))
      || durationCell.textContent.trim() : '';
    const duration = durationText ? parseClock(durationText) : null;
    if (!title || duration === null) throw new Error('SAVED_PLAYLIST_INCOMPLETE');
    return { title, duration };
  });
  const durationContainer = countText?.parentElement;
  const durationTexts = durationContainer ? [
    ...[...durationContainer.querySelectorAll('[title], [aria-label]')]
      .flatMap((element) => [element.getAttribute('title') || '', element.getAttribute('aria-label') || '']),
    durationContainer.textContent,
  ] : [];
  const publishedDurations = durationTexts.map(parseWrittenDuration).filter(Boolean);
  const publishedDuration = publishedDurations.find((duration) => duration.precision === 'second') || publishedDurations[0];
  const totalSeconds = publishedDuration?.seconds ?? songs.reduce((sum, song) => sum + song.duration, 0);
  const durationPrecision = publishedDuration?.precision || 'second';
  const name = (isAlbum ? page.querySelector('[data-testid="entityTitle"]')?.textContent.trim()
    : grid.getAttribute('aria-label')?.trim()) || document.title.replace(/\s*-\s*(?:playlist|album) by .*$/i, '').trim();
  if (!name) throw new Error('SAVED_PLAYLIST_INVALID');

  return {
    name,
    artist: isAlbum ? [...page.querySelectorAll('[data-testid="entity-header"] a[href*="/artist/"]')]
      .map((link) => link.textContent.trim()).filter(Boolean).filter((name, index, names) => names.indexOf(name) === index).join(', ')
      : document.querySelector('[data-testid="creator-link"]')?.textContent.trim() || '',
    artwork: pageCover(page, isAlbum),
    releaseDate: isAlbum ? albumReleaseDate(page) : '',
    runtime: formatRuntime(totalSeconds, durationPrecision),
    tracklist: songs.map((song, index) => `${index + 1}. ${song.title}`).join('\n'),
    trackCount: songs.length,
    durationEstimated: !publishedDuration,
    durationPrecision,
    resourceType: isAlbum ? 'album' : 'playlist',
    source: 'spotify-saved-page',
    spotifyLink: savedPageLink(html, document, isAlbum ? 'album' : 'playlist'),
  };
}
