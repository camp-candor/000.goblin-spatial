import { describe, it, expect } from 'vitest';
import { createAxialCoord, packAxial } from '../28.axial.unit/val/axial.model.js';
import {
  traceFiniteSupercover,
  hasLineOfSightFinite,
  clipSegmentAgainstHex
} from '../41.segment.unit/buz/segment.buzz.js';
import { axialToDoubled } from '../28.axial.unit/buz/axial.buzz.js';

describe('Task 4.1: Finite-Segment Hex Supercover Line Algorithm', () => {
  it('guarantees identical endpoint features on zero-length segment', () => {
    const origin = createAxialCoord(2, 3);
    const trace = traceFiniteSupercover(origin, origin);
    expect(trace.steps).toBe(0);
    expect(trace.traversedCells.length).toBe(1);
    expect(trace.traversedCells[0]).toBe(packAxial(2, 3));
  });

  it('verifies finite segment bounds do not block on walls beyond target', () => {
    // A = (0, 0), B = (0, 2), Wall = (0, 3) Collinear beyond target
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(0, 2);
    const beyondWall = packAxial(0, 3);

    const isOpaque = (packed: number) => packed === beyondWall;

    const los = hasLineOfSightFinite(origin, target, isOpaque);
    expect(los).toBe(true);

    const trace = traceFiniteSupercover(origin, target);
    const containsBeyondWall = trace.traversedCells.includes(beyondWall);
    expect(containsBeyondWall).toBe(false);
  });

  it('correctly detects intermediate blocking wall on straight segment', () => {
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(0, 2);
    const intermediateWall = packAxial(0, 1);

    const isOpaque = (packed: number) => packed === intermediateWall;

    expect(hasLineOfSightFinite(origin, target, isOpaque)).toBe(false);
    expect(hasLineOfSightFinite(target, origin, isOpaque)).toBe(false);
  });

  it('guarantees optical reciprocity across randomized pairs', () => {
    const pairs: [number, number, number, number][] = [
      [0, 0, 3, -1],
      [-2, 1, 2, -2],
      [-3, 0, 1, 3],
      [1, -2, -1, 4],
      [0, -3, 3, 0]
    ];

    const obstacle = packAxial(1, 0);
    const isOpaque = (p: number) => p === obstacle;

    for (const [q1, r1, q2, r2] of pairs) {
      const a = createAxialCoord(q1, r1);
      const b = createAxialCoord(q2, r2);

      const losAB = hasLineOfSightFinite(a, b, isOpaque);
      const losBA = hasLineOfSightFinite(b, a, isOpaque);
      expect(losAB).toBe(losBA);

      const traceAB = traceFiniteSupercover(a, b);
      const traceBA = traceFiniteSupercover(b, a);
      expect(traceAB.traversedCells.length).toBe(traceBA.traversedCells.length);
    }
  });

  it('verifies Cyrus-Beck clipping reports false for hexes completely disjoint from segment', () => {
    const pA = axialToDoubled(createAxialCoord(0, 0));
    const pB = axialToDoubled(createAxialCoord(0, 2));
    const disjointCell = createAxialCoord(5, 5);

    const clip = clipSegmentAgainstHex(
      BigInt(pA.x), BigInt(pA.y),
      BigInt(pB.x), BigInt(pB.y),
      disjointCell
    );
    expect(clip.intersects).toBe(false);
  });
});
