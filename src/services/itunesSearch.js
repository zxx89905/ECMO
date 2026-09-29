const API = 'https://itunes.apple.com';

export function getLargerArtwork(url, size = 1000) {
  if (!url) return '';
  return url.replace(/\/\d+x\d+(?:bb)?(?:-\d+)?\.(jpe?g|png)$/i, `/${size}x${size}bb.$1`);
}

export async function searchItunesAlbums(term, country = 'us', signal) {
  const params = new URLSearchParams({ term: term.trim(), country, media: 'music', entity: 'album', limit: '12' });
  const response = await fetch(`${API}/search?${params}`, { signal });
  if (!response.ok) throw new Error(`iTunes search: ${response.status}`);
  const data = await response.json();
  return (data.results || [])
    .filter((result) => result.collectionId && result.collectionName)
    .map((result) => ({
      id: result.collectionId,
      name: result.collectionName,
      artist: result.artistName || '',
      artwork: getLargerArtwork(result.artworkUrl100),
      thumbnail: result.artworkUrl100 || '',
      releaseDate: result.releaseDate?.slice(0, 10) || '',
      trackCount: result.trackCount || 0,
      storeUrl: result.collectionViewUrl || '',
    }));
}

export async function getItunesAlbumTracks(id, country = 'us', signal) {
  const params = new URLSearchParams({ id: String(id), country, entity: 'song', limit: '200' });
  const response = await fetch(`${API}/lookup?${params}`, { signal });
  if (!response.ok) throw new Error(`iTunes lookup: ${response.status}`);
  const data = await response.json();
  const tracks = (data.results || [])
    .filter((item) => item.wrapperType === 'track' && item.trackName)
    .sort((a, b) => (a.discNumber || 1) - (b.discNumber || 1) || (a.trackNumber || 0) - (b.trackNumber || 0));
  const duration = tracks.reduce((sum, item) => sum + (item.trackTimeMillis || 0), 0);
  const totalSeconds = Math.floor(duration / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    tracklist: tracks.map((item, index) => `${index + 1}. ${item.trackName}`).join('\n'),
    runtime: duration ? (hours ? `${hours}h ${minutes}min ${seconds}s` : `${minutes}min ${seconds}s`) : '',
  };
}
