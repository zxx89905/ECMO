import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSpotifyAlbumId, parseSpotifyPlaylistId, recolorSpotifyCodeSvg } from './spotifyCode.js';

const id = '2up3OPMp9Tb4dAKM2erWXQ';

test('accepts Spotify album links, URIs and IDs', () => {
  assert.equal(parseSpotifyAlbumId(`https://open.spotify.com/album/${id}?si=share`), id);
  assert.equal(parseSpotifyAlbumId(`https://open.spotify.com/intl-zh/album/${id}`), id);
  assert.equal(parseSpotifyAlbumId(`open.spotify.com/album/${id}`), id);
  assert.equal(parseSpotifyAlbumId(`spotify:album:${id}`), id);
  assert.equal(parseSpotifyAlbumId(id), id);
});

test('rejects non-albums and lookalike hosts', () => {
  assert.equal(parseSpotifyAlbumId(`https://open.spotify.com/track/${id}`), null);
  assert.equal(parseSpotifyAlbumId(`https://open.spotify.com.evil.example/album/${id}`), null);
  assert.equal(parseSpotifyAlbumId('not a Spotify link'), null);
});

test('accepts playlist links and URIs without treating albums as playlists', () => {
  const playlistId = '0ay6GpCWG7oATkGm1JQEVr';
  assert.equal(parseSpotifyPlaylistId(`https://open.spotify.com/playlist/${playlistId}?si=share`), playlistId);
  assert.equal(parseSpotifyPlaylistId(`spotify:playlist:${playlistId}`), playlistId);
  assert.equal(parseSpotifyPlaylistId(`https://open.spotify.com/album/${playlistId}`), null);
  assert.equal(parseSpotifyPlaylistId(`https://open.spotify.com.evil.example/playlist/${playlistId}`), null);
});

test('colors the code like the poster text while preserving its background', () => {
  const darkSvg = '<rect fill="#401a13"/><rect fill="#ffffff"/><rect fill="#ffffff"/>';
  assert.equal(recolorSpotifyCodeSvg(darkSvg, 'white', '#f0c35a'), '<rect fill="#401a13"/><rect fill="#f0c35a"/><rect fill="#f0c35a"/>');

  const lightSvg = '<rect fill="#eeeeee"/><rect fill="#000000"/>';
  assert.equal(recolorSpotifyCodeSvg(lightSvg, 'black', '#654321'), '<rect fill="#eeeeee"/><rect fill="#654321"/>');
});
