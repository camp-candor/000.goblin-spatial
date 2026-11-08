import { describe, it, expect } from 'vitest';
import { createAxialCoord, packAxial, PackedAxial } from '../28.axial.unit/val/axial.model.js';
import {
  VERTEX_MAJORITY_TABLE,
  evaluateVertexMajorityMask,
  getThreeHexesAtVertex
} from '../17.observer.unit/val/observer.model.js';
import {
  evaluateRayVertexCrossings,
  isPointOnFiniteSegment
} from '../17.observer.unit/buz/observer.buzz.js';
import { axialToDoubled } from '../28.axial.unit/buz/axial.buzz.js';

describe('Task 4.2: Majority Rule Vertex Crossing Occlusion Policy', () => {
  it('exhaustively satisfies the 8-row vertex majority truth table', () => {
    // Row 000..111
    const expected = [false, false, false, true, false, true, true, true];
    for (let mask = 0; mask < 8; mask++) {
      expect(evaluateVertexMajorityMask(mask)).toBe(expected[mask]);
      expect(VERTEX_MAJORITY_TABLE[mask]).toBe(expected[mask]);
    }
  });

  it('determines exactly 3 distinct hexes sharing any lattice vertex', () => {
    const origin = createAxialCoord(0, 0);
    const d = axialToDoubled(origin);
    // Vertex V0 = (cx, cy + 4) = (0, 4)
    const hexes = getThreeHexesAtVertex(BigInt(d.x), BigInt(d.y + 4));
    expect(hexes.length).toBe(3);

    // Verify all 3 cells are unique
    const packed = hexes.map((h) => packAxial(h.q, h.r));
    const unique = new Set(packed);
    expect(unique.size).toBe(3);
  });

  it('permits sightline grazing past an isolated single wall corner (1 of 3 opaque)', () => {
    // Knight-move sightline (0, 0) to (2, -1) intersects vertex (2, 2)
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(2, -1);

    // Make exactly one surrounding cell opaque
    const singleWall = packAxial(1, 0);
    const isOpaque = (p: PackedAxial) => p === singleWall;

    const evalResult = evaluateRayVertexCrossings(origin, target, isOpaque);
    expect(evalResult.hasClearLineOfSight).toBe(true);
    expect(evalResult.vertexEvents.length).toBeGreaterThan(0);
    expect(evalResult.vertexEvents.every((e) => !e.isBlocked)).toBe(true);
  });

  it('severs sightline pinched between two wall corners (2 of 3 opaque)', () => {
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(2, -1);

    // Two of the three hexes meeting at the shared vertex are opaque
    const wall1 = packAxial(1, 0);
    const wall2 = packAxial(1, -1);
    const opaqueSet = new Set<PackedAxial>([wall1, wall2]);
    const isOpaque = (p: PackedAxial) => opaqueSet.has(p);

    const evalResult = evaluateRayVertexCrossings(origin, target, isOpaque);
    expect(evalResult.hasClearLineOfSight).toBe(false);
    expect(evalResult.severedAtVertex).toBeDefined();
  });

  it('exempts origin and target cells from the vertex majority vote', () => {
    const origin = createAxialCoord(0, 0);
    const target = createAxialCoord(2, -1);

    // Even if origin and target are marked opaque in the map, they count as transparent (0)
    const wall1 = packAxial(1, 0);
    const opaqueSet = new Set<PackedAxial>([
      packAxial(0, 0), // origin
      packAxial(2, -1), // target
      wall1 // only 1 intermediate wall
    ]);
    const isOpaque = (p: PackedAxial) => opaqueSet.has(p);

    const evalResult = evaluateRayVertexCrossings(origin, target, isOpaque);
    // With origin and target exempt, only wall1 counts -> mask has only 1 set bit -> clear!
    expect(evalResult.hasClearLineOfSight).toBe(true);
  });

  it('confirms bidirectional symmetry across vertex crossings', () => {
    const a = createAxialCoord(0, 0);
    const b = createAxialCoord(2, -1);

    const wall1 = packAxial(1, 0);
    const wall2 = packAxial(1, -1);
    const isOpaque = (p: PackedAxial) => p === wall1 || p === wall2;

    const evalAB = evaluateRayVertexCrossings(a, b, isOpaque);
    const evalBA = evaluateRayVertexCrossings(b, a, isOpaque);
    expect(evalAB.hasClearLineOfSight).toBe(evalBA.hasClearLineOfSight);
  });
});
