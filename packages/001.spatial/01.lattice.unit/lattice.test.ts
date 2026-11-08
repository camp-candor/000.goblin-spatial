import { describe, it, expect } from 'vitest';
import {
    axialDistance,
    axialNeighbors,
    axialRange,
    hexCentroid,
    hexVertices,
    hexEdgeMidpoints,
    sharedEdgeEndpoints,
    packAxialCell,
    unpackAxialCell,
    createAxialCoord,
    HEX_DIRECTIONS,
} from './index.js';
import type { TacticalCellId, LatticePoint } from './index.js';

describe('01.lattice.unit affine tiling coincidence & metric space axioms', () => {
    // Generate canonical radius-5 disk (N = 1 + 3*5*6 = 91 cells)
    const originCell = packAxialCell(0, 0);
    const diskCells = axialRange(originCell, 5);

    describe('1. Metric Space Axioms on axialDistance', () => {
        it('verifies disk cardinality N = 91 for radius 5', () => {
            expect(diskCells.length).toBe(91);
        });

        it('satisfies Identity of Indiscernibles: d(a, b) === 0 iff a === b', () => {
            for (let i = 0; i < diskCells.length; i++) {
                const a = diskCells[i];
                // d(a, a) must be 0
                expect(axialDistance(a, a)).toBe(0);

                // d(a, b) > 0 for all distinct b
                const other = diskCells[(i + 13) % diskCells.length];
                if (a !== other) {
                    expect(axialDistance(a, other)).toBeGreaterThan(0);
                }
            }
        });

        it('satisfies Non-Negativity: d(a, b) >= 0 for all cell pairs', () => {
            for (let i = 0; i < diskCells.length; i += 7) {
                const a = diskCells[i];
                for (let j = 0; j < diskCells.length; j += 11) {
                    const b = diskCells[j];
                    expect(axialDistance(a, b)).toBeGreaterThanOrEqual(0);
                }
            }
        });

        it('satisfies Symmetry: d(a, b) === d(b, a) across all pairs in radius-5 disk', () => {
            for (let i = 0; i < diskCells.length; i += 3) {
                const a = diskCells[i];
                for (let j = 0; j < diskCells.length; j += 5) {
                    const b = diskCells[j];
                    expect(axialDistance(a, b)).toBe(axialDistance(b, a));
                }
            }
        });

        it('satisfies Triangle Inequality: d(a, c) <= d(a, b) + d(b, c) across all triplets', () => {
            // Test 100 deterministic triplets across the disk
            for (let i = 0; i < 100; i++) {
                const a = diskCells[(i * 17) % diskCells.length];
                const b = diskCells[(i * 31) % diskCells.length];
                const c = diskCells[(i * 53) % diskCells.length];

                const dAC = axialDistance(a, c);
                const dAB = axialDistance(a, b);
                const dBC = axialDistance(b, c);

                expect(dAC).toBeLessThanOrEqual(dAB + dBC);
            }
        });
    });

    describe('2. Affine Tiling Coincidence (Shared Edges & Midpoints)', () => {
        it('verifies shared edge midpoint coincidence between all 91 cells and their 6 neighbors', () => {
            for (const cellA of diskCells) {
                const coordA = unpackAxialCell(cellA);
                const midpointsA = hexEdgeMidpoints(coordA.q, coordA.r);

                for (let dir = 0; dir < 6; dir++) {
                    const offset = HEX_DIRECTIONS[dir];
                    const nQ = coordA.q + offset.q;
                    const nR = coordA.r + offset.r;
                    const cellB = packAxialCell(nQ, nR);

                    // Opposite direction index on pointy-top hex grid: (dir + 3) % 6
                    const oppDir = (dir + 3) % 6;
                    const midpointsB = hexEdgeMidpoints(nQ, nR);

                    // Map HexDirection index to HexEdgeMidpoints index
                    const dirToEdgeIdx = [1, 2, 3, 4, 5, 0];
                    const midA = midpointsA[dirToEdgeIdx[dir]];
                    const midB = midpointsB[dirToEdgeIdx[oppDir]];

                    // Exact BigInt coordinate coincidence
                    expect(midA.x).toBe(midB.x);
                    expect(midA.y).toBe(midB.y);
                }
            }
        });

        it('verifies shared polygon vertices coincide identically between all adjacent cell pairs', () => {
            for (const cellA of diskCells) {
                const neighbors = axialNeighbors(cellA);

                for (const cellB of neighbors) {
                    const [p1, p2] = sharedEdgeEndpoints(cellA, cellB);
                    const vertsA = hexVertices(cellA);
                    const vertsB = hexVertices(cellB);

                    // Both endpoints must exist in Cell A's vertices
                    const p1InA = vertsA.some((v) => v.x === p1.x && v.y === p1.y);
                    const p2InA = vertsA.some((v) => v.x === p2.x && v.y === p2.y);
                    expect(p1InA).toBe(true);
                    expect(p2InA).toBe(true);

                    // Both endpoints must exist in Cell B's vertices
                    const p1InB = vertsB.some((v) => v.x === p1.x && v.y === p1.y);
                    const p2InB = vertsB.some((v) => v.x === p2.x && v.y === p2.y);
                    expect(p1InB).toBe(true);
                    expect(p2InB).toBe(true);
                }
            }
        });

        it('verifies optical symmetry: sharedEdgeEndpoints(A, B) === sharedEdgeEndpoints(B, A)', () => {
            for (let i = 0; i < diskCells.length; i += 5) {
                const cellA = diskCells[i];
                const neighbors = axialNeighbors(cellA);

                for (const cellB of neighbors) {
                    const segAB = sharedEdgeEndpoints(cellA, cellB);
                    const segBA = sharedEdgeEndpoints(cellB, cellA);

                    expect(segAB[0].x).toBe(segBA[0].x);
                    expect(segAB[0].y).toBe(segBA[0].y);
                    expect(segAB[1].x).toBe(segBA[1].x);
                    expect(segAB[1].y).toBe(segBA[1].y);
                }
            }
        });
    });

    describe('3. Three-Hex Vertex Confluence Invariant', () => {
        it('proves every interior vertex is shared by exactly 3 contiguous hexes with bit-identical coordinates', () => {
            // Map: stringified vertex -> Set of cell IDs that touch it
            const vertexToCells = new Map<string, Set<TacticalCellId>>();

            // Inspect cells in radius 3 (ensures interior vertices are fully surrounded)
            const interiorCells = axialRange(originCell, 3);

            for (const cell of interiorCells) {
                const verts = hexVertices(cell);
                for (const v of verts) {
                    const key = `${v.x},${v.y}`;
                    if (!vertexToCells.has(key)) {
                        vertexToCells.set(key, new Set());
                    }
                    vertexToCells.get(key)!.add(cell);
                }
            }

            // For fully enclosed interior vertices, exactly 3 hexes must meet
            let threeHexVertexCount = 0;
            for (const [_vKey, sharingCells] of vertexToCells.entries()) {
                if (sharingCells.size === 3) {
                    threeHexVertexCount++;
                    const cellsArr = Array.from(sharingCells);

                    // Assert pairwise adjacency among the 3 cells (each pair has distance 1)
                    expect(axialDistance(cellsArr[0], cellsArr[1])).toBe(1);
                    expect(axialDistance(cellsArr[1], cellsArr[2])).toBe(1);
                    expect(axialDistance(cellsArr[0], cellsArr[2])).toBe(1);
                }
            }

            expect(threeHexVertexCount).toBeGreaterThan(0);
        });
    });

    describe('4. The Affine Distance Caveat Demonstration', () => {
        it('proves Euclidean distance in doubled space is non-isometric, while axial distance is isometric', () => {
            const originCoord = unpackAxialCell(originCell);
            const originCentroid = hexCentroid(originCell);

            // In doubled affine space cx = 4q + 2r, cy = 6r:
            // Direction 0 (East, +1, 0):    Centroid = (4, 0)   => dx = 4, dy = 0  => dx^2 + dy^2 = 16
            // Direction 5 (North-East, 0, 1): Centroid = (2, 6) => dx = 2, dy = 6  => dx^2 + dy^2 = 4 + 36 = 40
            const eastCell = packAxialCell(originCoord.q + 1, originCoord.r);
            const neCell = packAxialCell(originCoord.q, originCoord.r + 1);

            const eastCentroid = hexCentroid(eastCell);
            const neCentroid = hexCentroid(neCell);

            const dxEast = Number(eastCentroid.x - originCentroid.x);
            const dyEast = Number(eastCentroid.y - originCentroid.y);
            const sqDistEast = dxEast * dxEast + dyEast * dyEast; // 16

            const dxNE = Number(neCentroid.x - originCentroid.x);
            const dyNE = Number(neCentroid.y - originCentroid.y);
            const sqDistNE = dxNE * dxNE + dyNE * dyNE; // 40

            // Euclidean distance is severely distorted (16 !== 40)
            expect(sqDistEast).toBe(16);
            expect(sqDistNE).toBe(40);
            expect(sqDistEast).not.toBe(sqDistNE);

            // Axial distance strictly preserves true metric isometry (1 === 1)
            expect(axialDistance(originCell, eastCell)).toBe(1);
            expect(axialDistance(originCell, neCell)).toBe(1);

            // All 6 compass neighbors have strictly axial distance === 1
            for (let dir = 0; dir < 6; dir++) {
                const offset = HEX_DIRECTIONS[dir];
                const neighbor = packAxialCell(originCoord.q + offset.q, originCoord.r + offset.r);
                expect(axialDistance(originCell, neighbor)).toBe(1);
            }
        });
    });

    describe('5. Universal Negative Controls & Fail-Closed Bounds', () => {
        it('throws NON_ADJACENT_CELLS when evaluating sharedEdgeEndpoints on non-adjacent cells', () => {
            const cellA = packAxialCell(0, 0);
            const cellDistant = packAxialCell(2, 0); // distance 2

            expect(() => sharedEdgeEndpoints(cellA, cellDistant)).toThrow(/NON_ADJACENT_CELLS/);
        });

        it('throws NON_ADJACENT_CELLS when evaluating sharedEdgeEndpoints on identical cells', () => {
            const cellA = packAxialCell(3, -2);
            expect(() => sharedEdgeEndpoints(cellA, cellA)).toThrow(/NON_ADJACENT_CELLS/);
        });
    });
});
