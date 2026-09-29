let cachedToken = '';
let tokenExpiresAt = 0;
let pendingToken = null;

async function getAccessToken() {
    if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;
    if (pendingToken) return pendingToken;

    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Missing Spotify credentials');

    pendingToken = (async () => {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: 'grant_type=client_credentials',
        });
        if (!response.ok) throw new Error(`Spotify token: ${response.status}`);
        const data = await response.json();
        if (!data.access_token) throw new Error('No Spotify access token');
        cachedToken = data.access_token;
        tokenExpiresAt = Date.now() + Math.max(0, (data.expires_in || 3600) - 60) * 1000;
        return cachedToken;
    })();

    try {
        return await pendingToken;
    } finally {
        pendingToken = null;
    }
}

async function spotifyGet(path, signal) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const token = await getAccessToken();
        if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError');
        const response = await fetch(`https://api.spotify.com/v1/${path}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
        });
        if (response.status === 401 && attempt === 0) {
            cachedToken = '';
            tokenExpiresAt = 0;
            continue;
        }
        if (!response.ok) {
            const error = new Error(`Spotify API: ${response.status}`);
            error.status = response.status;
            throw error;
        }
        return response.json();
    }
}

export function searchSpotifyAlbums(query, limit, offset, signal) {
    const search = query || `tag:new year:${new Date().getFullYear()}`;
    const params = new URLSearchParams({ q: search, type: 'album', limit: String(limit), offset: String(offset) });
    return spotifyGet(`search?${params}`, signal);
}

export function getSpotifyAlbum(id, signal) {
    return spotifyGet(`albums/${encodeURIComponent(id)}`, signal);
}
