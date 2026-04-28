// 完全复制 posterfy 官方写法
const getToken = async () => {
  try {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        client_secret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
      }),
    });
    const data = await result.json();
    return data.access_token;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const searchAlbums = async (query) => {
  const token = await getToken();
  if (!token) return [];

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return data.albums?.items || [];
  } catch (err) {
    return [];
  }
};

export const getAlbum = async (id) => {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};