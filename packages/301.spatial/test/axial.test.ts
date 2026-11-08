import { describe, it, expect } from 'vitest';
import {
  createAxialCoord,
  packAxial,
  unpackAxial,
  unpackQ,
  unpackR,
  COORD_OFFSET
} from '../28.axial.unit/val/axial.model.js';
import {
  axialToDoubled,
  doubledToAxial,
  axialDistance,
  chordDistanceSquared,
  hexVertices,
  assertAxialInvariant
} from '../28.axial.unit/buz/axial.buzz.js';
import {
  getNeighbor,
  getAllNeighbors,
  AXIAL_DIRECTIONS
} from '../46.neighbor.unit/buz/neighbor.buzz.js';
import {
  getRing,
  getSpiralDisk,
  expectedHexCountForRadius
} from '../21.lattice.unit/buz/lattice.buzz.js';

describe('Phase 2 Discrete Axial Coordinate Math Engine', () => {
  it('enforces planar invariant q + r + s === 0', () => {
    const c = createAxialCoord(4, -7);
    expect(c.q).toBe(4);
    expect(c.r).toBe(-7);
    expect(c.s).toBe(3);
    expect(() => assertAxialInvariant(c)).not.toThrow();
  });

  it('serializes and deserializes packed axial coordinates reversibly', () => {
    const coordinates = [
      [0, 0],
      [1, -1],
      [-5, 3],
      [100, -200],
      [-COORD_OFFSET, COORD_OFFSET - 1],
      [COORD_OFFSET - 1, -COORD_OFFSET]
    ] as const;

    for (const [q, r] of coordinates) {
      const packed = packAxial(q, r);
      expect(unpackQ(packed)).toBe(q);
      expect(unpackR(packed)).toBe(r);
      const unpacked = unpackAxial(packed);
      expect(unpacked.q).toBe(q);
      expect(unpacked.r).toBe(r);
      expect(unpacked.s).toBe(-q - r);
    }
  });

  it('converts axial coordinates to doubled coordinates and back without float drift', () => {
    for (let q = -10; q <= 10; q++) {
      for (let r = -10; r <= 10; r++) {
        const axial = createAxialCoord(q, r);
        const doubled = axialToDoubled(axial);
        expect(doubled.x).toBe(4 * q + 2 * r);
        expect(doubled.y).toBe(6 * r);
        const recovered = doubledToAxial(doubled);
        expect(recovered.q).toBe(q);
        expect(recovered.r).toBe(r);
      }
    }
  });

  it('calculates hexagonal metric axial distance correctly', () => {
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(3, -5);
    expect(axialDistance(origin, target)).toBe(5);
    expect(axialDistance(target, origin)).toBe(5);
  });

  it('computes exact integer chord distance squared and hex vertices', () => {
    const a = createAxialCoord(0, 0);
    const b = createAxialCoord(1, 0);
    const chordSq = chordDistanceSquared(a, b);
    expect(chordSq).toBe(16n); // da=(0,0), db=(4,0) -> 4^2 = 16

    const vertices = hexVertices(a);
    expect(vertices.length).toBe(6);
    expect(vertices[0]).toEqual({ x: 0n, y: 4n });
    expect(vertices[3]).toEqual({ x: 0n, y: -4n });
  });

  it('traverses 6 directions and returns to origin in closed loop', () => {
    let curr = createAxialCoord(0, 0);
    for (let d = 0; d < 6; d++) {
      curr = getNeighbor(curr, d);
    }
    expect(curr.q).toBe(0);
    expect(curr.r).toBe(0);
  });

  it('retrieves all 6 immediate neighbors', () => {
    const origin = createAxialCoord(0, 0);
    const neighbors = getAllNeighbors(origin);
    expect(neighbors.length).toBe(6);
    for (const n of neighbors) {
      expect(axialDistance(origin, n)).toBe(1);
    }
  });

  it('generates concentric rings with exact hex counts', () => {
    const origin = createAxialCoord(0, 0);
    expect(getRing(origin, 0).length).toBe(1);
    expect(getRing(origin, 1).length).toBe(6);
    expect(getRing(origin, 2).length).toBe(12);
    expect(getRing(origin, 3).length).toBe(18);
  });

  it('generates spiral disks matching 3n(n+1) + 1 formula', () => {
    const origin = createAxialCoord(0, 0);
    for (let r = 0; r <= 5; r++) {
      const disk = getSpiralDisk(origin, r);
      expect(disk.length).toBe(expectedHexCountForRadius(r));
    }
    // Radius 10 hex count verification: 3 * 10 * 11 + 1 = 331
    expect(getSpiralDisk(origin, 10).length).toBe(331);
  });

  it('executes one hundred thousand coordinate conversions within sub-millisecond rates', () => {
    const start = performance.now();
    let acc = 0;
    for (let i = 0; i < 100000; i++) {
      const q = (i % 200) - 100;
      const r = ((i * 3) % 200) - 100;
      const packed = packAxial(q, r);
      acc += unpackQ(packed) + unpackR(packed);
    }
    const elapsed = performance.now() - start;
    expect(acc).toBeDefined();
    // 100k unpacks must complete in under 50ms locally
    expect(elapsed).toBeLessThan(50);
  });
});
