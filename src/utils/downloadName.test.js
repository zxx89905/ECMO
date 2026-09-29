import test from 'node:test';
import assert from 'node:assert/strict';
import { albumFileName, imageExtension } from './downloadName.js';

test('posters keep the album title and covers add only Cover', () => {
  assert.equal(albumFileName('Winning Vibes'), 'Winning Vibes.png');
  assert.equal(albumFileName('Winning Vibes', 'jpg', 'Cover'), 'Winning Vibes Cover.jpg');
  assert.equal(albumFileName('AC/DC: Live?', 'jpg'), 'AC DC Live.jpg');
  assert.equal(albumFileName('', 'png', 'Cover'), 'Album Cover.png');
  assert.equal(imageExtension('image/jpeg'), 'jpg');
  assert.equal(imageExtension('image/webp'), 'webp');
});
