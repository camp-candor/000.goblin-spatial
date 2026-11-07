
import { describe, it, expect } from 'vitest';
import {
    hexCentroid,
    hexVertices,
    hexEdgeMidpoints,
    sharedEdgeEndpoints,
    packAxialCell,
} from '../index.js';

describe('01.lattice.unit doubled affine coordinate projectors', () => {
    describe('hexCentroid Projections', () => {
        it('projects origin (0, 0) to (0n, 0n)', () => {
            const origin = hexCentroid(0, 0);
            expect(origin.x).toBe(0n);
            expect(origin.y).toBe(0n);
        });

        it('projects axial coordinates according to cx = 4q + 2r, cy = 6r', () => {
            const cases = [
                { q: 1, r: 0, expected: { x: 4n, y: 0n } },
                { q: 0, r: 1, expected: { x: 2n, y: 6n } },
                { q: 1, r: 1, expected: { x: 6n, y: 6n } },
                { q: -2, r: 3, expected: { x: -2n, y: 18n } },
                { q: 12, r: -4, expected: { x: 40n, y: -24n } },
            ];

            for (const { q, r, expected } of cases) {
                const pt = hexCentroid(q, r);
                expect(pt.x).toBe(expected.x);
                expect(pt.y).toBe(expected.y);
            }
        });

        it('supports overloaded call with packed TacticalCellId', () => {
            const packed = packAxialCell(12, -4);
            const pt = hexCentroid(packed);
            expect(pt.x).toBe(40n);
            expect(pt.y).toBe(-24n);
        });
    });

    describe('hexVertices Clockwise Polygon Offsets', () => {
        it('computes exact 6 vertices around the origin (0, 0)', () => {
            const verts = hexVertices(0, 0);
            expect(verts.length).toBe(6);

            // Origin cx = 0, cy = 0
            expect(verts[0]).toEqual({ x: 0n, y: 4n });    // V0: Top
            expect(verts[1]).toEqual({ x: 2n, y: 2n });    // V1: Top-Right
            expect(verts[2]).toEqual({ x: 2n, y: -2n });   // V2: Bottom-Right
            expect(verts[3]).toEqual({ x: 0n, y: -4n });   // V3: Bottom
            expect(verts[4]).toEqual({ x: -2n, y: -2n });  // V4: Bottom-Left
            expect(verts[5]).toEqual({ x: -2n, y: 2n });   // V5: Top-Left
        });

        it('computes exact vertices for translated cells', () => {
            // (q: 1, r: 0) -> cx = 4, cy = 0
            const verts = hexVertices(1, 0);
            expect(verts[0]).toEqual({ x: 4n, y: 4n });
            expect(verts[1]).toEqual({ x: 6n, y: 2n });
            expect(verts[2]).toEqual({ x: 6n, y: -2n });
            expect(verts[3]).toEqual({ x: 4n, y: -4n });
            expect(verts[4]).toEqual({ x: 2n, y: -2n });
            expect(verts[5]).toEqual({ x: 2n, y: 2n });
        });
    });

    describe('hexEdgeMidpoints Arithmetic', () => {
        it('computes exact 6 edge midpoints around the origin (0, 0)', () => {
            const edges = hexEdgeMidpoints(0, 0);
            expect(edges.length).toBe(6);

            expect(edges[0]).toEqual({ x: 1n, y: 3n });   // E0
            expect(edges[1]).toEqual({ x: 2n, y: 0n });   // E1
            expect(edges[2]).toEqual({ x: 1n, y: -3n });  // E2
            expect(edges[3]).toEqual({ x: -1n, y: -3n }); // E3
            expect(edges[4]).toEqual({ x: -2n, y: 0n });  // E4
            expect(edges[5]).toEqual({ x: -1n, y: 3n });  // E5
        });

        it('asserts edge midpoints match the average of consecutive vertices', () => {
            const verts = hexVertices(5, -3);
            const midpoints = hexEdgeMidpoints(5, -3);

            for (let i = 0; i < 6; i++) {
                const vA = verts[i];
                const vB = verts[(i + 1) % 6];
                const mid = midpoints[i];

                const expectedX = (vA.x + vB.x) / 2n;
                const expectedY = (vA.y + vB.y) / 2n;

                expect(mid.x).toBe(expectedX);
                expect(mid.y).toBe(expectedY);
            }
        });
    });

    describe('sharedEdgeEndpoints & Optical Symmetry', () => {
        it('computes shared boundary endpoints between adjacent East neighbor (0,0) and (1,0)', () => {
            const cellA = packAxialCell(0, 0);
            const cellB = packAxialCell(1, 0);

            const [p1, p2] = sharedEdgeEndpoints(cellA, cellB);

            // Shared boundary between (0,0) and (1,0) connects (2, 2) and (2, -2)
            expect(p1).toEqual({ x: 2n, y: -2n });
            expect(p2).toEqual({ x: 2n, y: 2n });
        });

        it('proves optical symmetry: sharedEdgeEndpoints(A, B) === sharedEdgeEndpoints(B, A)', () => {
            const neighbors = [
                { q: 1, r: 0 },   // East
                { q: 1, r: -1 },  // South-East
                { q: 0, r: -1 },  // South-West
                { q: -1, r: 0 },  // West
                { q: -1, r: 1 },  // North-West
                { q: 0, r: 1 },   // North-East
            ];

            const cellOrigin = packAxialCell(0, 0);

            for (const n of neighbors) {
                const cellN = packAxialCell(n.q, n.r);
                const segAB = sharedEdgeEndpoints(cellOrigin, cellN);
                const segBA = sharedEdgeEndpoints(cellN, cellOrigin);

                expect(segAB[0]).toEqual(segBA[0]);
                expect(segAB[1]).toEqual(segBA[1]);
            }
        });

        it('verifies shared endpoints coincide identically with vertices of both cells', () => {
            const cellA = packAxialCell(2, -1);
            const cellB = packAxialCell(2, 0); // North-East neighbor of (2, -1)

            const [s1, s2] = sharedEdgeEndpoints(cellA, cellB);
            const vertsA = hexVertices(2, -1);
            const vertsB = hexVertices(2, 0);

            const matchesA = (pt: { x: bigint; y: bigint }) =>
                vertsA.some((v) => v.x === pt.x && v.y === pt.y);
            const matchesB = (pt: { x: bigint; y: bigint }) =>
                vertsB.some((v) => v.x === pt.x && v.y === pt.y);

            expect(matchesA(s1)).toBe(true);
            expect(matchesA(s2)).toBe(true);
            expect(matchesB(s1)).toBe(true);
            expect(matchesB(s2)).toBe(true);
        });

        it('throws Error if cells are not directly adjacent', () => {
            const cell1 = packAxialCell(0, 0);
            const cell2 = packAxialCell(2, 0); // distance 2

            expect(() => sharedEdgeEndpoints(cell1, cell2)).toThrow(/NON_ADJACENT_CELLS/);
        });
    });
});
