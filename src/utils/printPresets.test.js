import test from 'node:test';
import assert from 'node:assert/strict';
import { getPrintPresets } from './printPresets.js';

test('A-series and inch presets carry exact print pixels and uppercase size labels', () => {
  const a = getPrintPresets('A尺寸');
  assert.deepEqual(a.map(({ label }) => label), ['A0', 'A1', 'A2', 'A3', 'A4', 'A5']);
  assert.deepEqual(a.map(({ label, ppi, width, height }) => [label, ppi, width, height]), [
    ['A0', 80, 2649, 3745],
    ['A1', 100, 2339, 3311],
    ['A2', 120, 1984, 2806],
    ['A3', 180, 2105, 2976],
    ['A4', 200, 1654, 2339],
    ['A5', 210, 1224, 1736],
  ]);

  const poster = getPrintPresets('2-3');
  assert.deepEqual(poster.map(({ label, ppi, width, height }) => [label, ppi, width, height]), [
    ['8X12', 200, 1600, 2400],
    ['10X15', 180, 1800, 2700],
    ['11X17', 180, 1980, 3060],
    ['12X18', 180, 2160, 3240],
    ['14X21', 180, 2520, 3780],
    ['16X24', 160, 2560, 3840],
    ['20X30', 120, 2400, 3600],
    ['24X36', 100, 2400, 3600],
    ['27X40', 90, 2430, 3600],
    ['32X48', 90, 2880, 4320],
  ]);
  assert.ok([...a, ...poster].every(({ width }) => width < 3000));
});
