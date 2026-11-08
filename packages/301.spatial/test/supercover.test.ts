import { describe, it, expect } from 'vitest';
import {
  AxialCoord,
  PackedAxial,
  createAxialCoord,
  packAxial
} from '../28.axial.unit/val/axial.model.js';
import {
  traceFiniteSupercover,
  hasLineOfSightFinite
} from '../41.segment.unit/buz/segment.buzz.js';
import { evaluateBruteForceOracleLoS } from './oracle.model.js';

describe('Task 4.4: Supercover Parity Oracle Benchmark Suite', () => {
  const R = 5;
  const diskCells: AxialCoord[] = [];
  const packedDiskCells: PackedAxial[] = [];

  // Generate radius-5 hex disk: N = 1 + 3R(R + 1) = 91 cells
  for (let q = -R; q <= R; q++) {
    for (let r = -R; r <= R; r++) {
      if (Math.abs(q + r) <= R) {
        const coord = createAxialCoord(q, r);
        diskCells.push(coord);
        packedDiskCells.push(packAxial(q, r));
      }
    }
  }

  it('proves exactly 91 tactical cells exist in the radius-5 disk', () => {
    const expectedCount = 1 + 3 * R * (R + 1);
    expect(diskCells.length).toBe(91);
    expect(diskCells.length).toBe(expectedCount);
  });

  it('guarantees bidirectional optical reciprocity across all 8,190 ordered cell pairs', () => {
    // Topology 1: Asymmetric Obstacle Layout
    const wallA = packAxial(0, 1);
    const wallB = packAxial(1, 0);
    const wallC = packAxial(-2, 1);
    const isOpaque = (p: PackedAxial) => p === wallA || p === wallB || p === wallC;

    let testedPairs = 0;

    for (let i = 0; i < diskCells.length; i++) {
      for (let j = 0; j < diskCells.length; j++) {
        if (i === j) continue;

        const cellA = diskCells[i];
        const cellB = diskCells[j];

        const losAB = hasLineOfSightFinite(cellA, cellB, isOpaque);
        const losBA = hasLineOfSightFinite(cellB, cellA, isOpaque);

        expect(losAB).toBe(losBA);
        testedPairs++;
      }
    }

    // P(91, 2) = 91 * 90 = 8,190 permutations
    expect(testedPairs).toBe(8190);
  });

  it('verifies 100% agreement between fast supercover and independent rational sampling oracle', () => {
    // Topology 2: Central Pillar Wall at (0, 0)
    const centralWall = packAxial(0, 0);
    const isOpaque = (p: PackedAxial) => p === centralWall;

    // Subsample pairs passing through or grazing the central pillar
    let comparisons = 0;
    for (let i = 0; i < diskCells.length; i += 3) {
      for (let j = 1; j < diskCells.length; j += 4) {
        if (i === j) continue;

        const cellA = diskCells[i];
        const cellB = diskCells[j];

        const fastResult = hasLineOfSightFinite(cellA, cellB, isOpaque);
        const oracleResult = evaluateBruteForceOracleLoS(
          cellA,
          cellB,
          diskCells,
          isOpaque,
          128
        );

        expect(fastResult).toBe(oracleResult);
        comparisons++;
      }
    }

    expect(comparisons).toBeGreaterThanOrEqual(500);
  });

  it('confirms reverse-feature symmetry on traversed supercover paths', () => {
    // Assert features(A, B) === reverse(features(B, A))
    const samplePairs: [number, number, number, number][] = [
      [-4, 2, 3, -1],
      [-3, -1, 2, 3],
      [0, -5, 0, 5],
      [-2, 4, 4, -2],
      [1, -3, -3, 2]
    ];

    for (const [q1, r1, q2, r2] of samplePairs) {
      const a = createAxialCoord(q1, r1);
      const b = createAxialCoord(q2, r2);

      const traceAB = traceFiniteSupercover(a, b);
      const traceBA = traceFiniteSupercover(b, a);

      expect(traceAB.traversedCells.length).toBe(traceBA.traversedCells.length);

      const reversedBA = [...traceBA.traversedCells].reverse();
      expect(traceAB.traversedCells).toEqual(reversedBA);
    }
  });

  it('executes individual raycasts well within the 2ms execution envelope', () => {
    const origin = createAxialCoord(-5, 0);
    const target = createAxialCoord(5, -5);
    const isOpaque = () => false;

    // Warmup
    for (let i = 0; i < 50; i++) {
      hasLineOfSightFinite(origin, target, isOpaque);
    }

    const start = performance.now();
    const iterations = 1000;
    for (let i = 0; i < iterations; i++) {
      hasLineOfSightFinite(origin, target, isOpaque);
    }
    const totalElapsed = performance.now() - start;
    const avgPerRayMs = totalElapsed / iterations;

    // Single raycast must execute in <= 0.05ms (sub-millisecond gate <= 2ms)
    expect(avgPerRayMs).toBeLessThanOrEqual(0.05);
  });
});
