import { describe, it, expect } from 'vitest';
import {
  AxialCoordSchema,
  packAxialCell,
  unpackAxialCell,
  TopologyManifestSchema,
  type TopologyManifest,
} from '../fce/manifest.schema.js';
import { DynamicOverlaySchema } from '../fce/overlay.schema.js';
import { mergeOverlaySnapshot } from '../buz/overlay.buzz.js';

describe('38.types.unit - Pure Geometric Types & Manifest Validation', () => {
  describe('AxialCoordSchema & Cubic Invariant', () => {
    it('accepts valid coordinates satisfying q + r + s === 0', () => {
      const coord = { q: 10, r: -5, s: -5 };
      expect(AxialCoordSchema.parse(coord)).toEqual(coord);
    });

    it('rejects coordinates breaching cubic invariant', () => {
      expect(() => AxialCoordSchema.parse({ q: 1, r: 1, s: 0 })).toThrow(
        '[CUBIC_INVARIANT_BREACH]'
      );
    });

    it('rejects floating-point numbers in coordinates', () => {
      expect(() => AxialCoordSchema.parse({ q: 1.5, r: -1.5, s: 0 })).toThrow(
        '[FLOAT_PROHIBITED]'
      );
    });

    it('rejects coordinates exceeding bounds [-32768, 32767]', () => {
      expect(() => AxialCoordSchema.parse({ q: 32768, r: -32768, s: 0 })).toThrow(
        '[OUT_OF_BOUNDS]'
      );
    });

    it('rejects un-schemaed narrative properties via .strict()', () => {
      expect(() =>
        AxialCoordSchema.parse({ q: 0, r: 0, s: 0, actorId: 'char_bog' } as any)
      ).toThrow();
    });
  });

  describe('Axial Packing Bijection', () => {
    it('packs and unpacks origin correctly', () => {
      const packed = packAxialCell(0, 0);
      expect(packed).toBe(2147516416); // 0x80008000
      const unpacked = unpackAxialCell(packed);
      expect(unpacked).toEqual({ q: 0, r: 0, s: 0 });
    });

    it('preserves cubic invariant across corner extrema', () => {
      const corners = [
        [-32768, -32768],
        [-32768, 32767],
        [32767, -32768],
        [32767, 32767],
      ];
      for (const [q, r] of corners) {
        const p = packAxialCell(q, r);
        const u = unpackAxialCell(p);
        expect(u.q).toBe(q);
        expect(u.r).toBe(r);
        expect(u.q + u.r + u.s).toBe(0);
      }
    });
  });

  describe('Topology Manifest & Dynamic Overlay Merger', () => {
    const dummyManifest: TopologyManifest = {
      topologyId: 'loc_great_hall',
      schemaVersion: 'v1.0',
      merkleRootHex: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      cells: [
        {
          coord: { q: 0, r: 0, s: 0 },
          packedId: 2147516416,
          costUnits: 100,
          passable: true,
        },
      ],
      portals: [
        {
          portalId: 'prt_archway',
          fromRoomId: 'loc_great_hall',
          toRoomId: 'loc_courtyard',
          entryCoord: { q: 0, r: 0, s: 0 },
          exitCoord: { q: 1, r: -1, s: 0 },
          acousticDampingCdb: 500,
          traversableDefault: false,
        },
      ],
      occluders: [
        {
          occluderId: 'occ_iron_gate',
          coord: { q: 0, r: 0, s: 0 },
          blocksLoSDefault: true,
          attenuationCdb: 1200,
        },
      ],
    };

    it('validates a schema-compliant topology manifest', () => {
      expect(TopologyManifestSchema.parse(dummyManifest)).toBeDefined();
    });

    it('merges dynamic overlay without mutating source manifest', () => {
      const overlay = DynamicOverlaySchema.parse({
        overlayId: 'ovl_stage_1',
        parentTopologyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        occluderOverrides: { occ_iron_gate: false },
        portalOverrides: { prt_archway: true },
        attenuationDeltasCdb: { occ_iron_gate: -400 },
      });

      const snapshot = mergeOverlaySnapshot(dummyManifest, overlay);

      expect(snapshot.portals[0].traversable).toBe(true);
      expect(snapshot.occluders[0].blocksLoS).toBe(false);
      expect(snapshot.occluders[0].attenuationCdb).toBe(800);

      // Verify source immutability
      expect(dummyManifest.portals[0].traversableDefault).toBe(false);
      expect(dummyManifest.occluders[0].blocksLoSDefault).toBe(true);
      expect(dummyManifest.occluders[0].attenuationCdb).toBe(1200);
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });
});
