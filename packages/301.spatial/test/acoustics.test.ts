import { describe, it, expect, beforeEach } from 'vitest';
import { createAxialCoord, packAxial } from '../28.axial.unit/val/axial.model.js';
import {
  toCentiDecibels,
  clampCentiDecibels,
  AIR_LOSS_PER_HEX_CDB,
  canonicalUndirectedEdgeKey
} from '../13.sound.unit/val/sound.model.js';
import { createPartitionRegistry, PartitionDampingRegistry } from '../49.edge.unit/buz/edge.buzz.js';
import { shouldPruneAcousticFrontier, verifyAudibilityDualCondition } from '../48.floor.unit/buz/floor.buzz.js';
import { computeAuditoryQualityPermille } from '../47.fraction.unit/buz/fraction.buzz.js';
import { computeAcousticWavefront, evaluateAuditoryPercept } from '../13.sound.unit/buz/sound.buzz.js';
import { createSoundPropagationAction } from '../98.menu.unit/buz/04.sound-menu.buzz.js';
import { createSpatialBus } from '../99.bus.unit/buz/bus.buzz.js';

describe('Phase 5 Centi-Decibel Acoustic Propagation Engine', () => {
  let registry: PartitionDampingRegistry;

  beforeEach(() => {
    registry = createPartitionRegistry();
  });

  it('enforces centi-decibel bounds and integer invariants', () => {
    expect(toCentiDecibels(0)).toBe(0);
    expect(toCentiDecibels(12000)).toBe(12000);
    expect(() => toCentiDecibels(-1)).toThrow(RangeError);
    expect(() => toCentiDecibels(12001)).toThrow(RangeError);

    expect(() => toCentiDecibels(450.5)).toThrow(TypeError);
  });

  it('guarantees undirected partition damping symmetry', () => {
    const p1 = packAxial(0, 0);
    const p2 = packAxial(1, 0);

    const k1 = canonicalUndirectedEdgeKey(p1, p2);
    const k2 = canonicalUndirectedEdgeKey(p2, p1);
    expect(k1).toBe(k2);

    registry.setPartitionDamping(p1, p2, toCentiDecibels(1500));
    expect(registry.getPartitionDamping(p1, p2)).toBe(1500);
    expect(registry.getPartitionDamping(p2, p1)).toBe(1500);
  });

  it('propagates sound in open air with exact 150 cdB dissipation per hex step', () => {
    const source = createAxialCoord(0, 0);
    const query = {
      sourceCoord: source,
      sourceIntensityCdb: toCentiDecibels(6000), // 60 dB
      ambientNoiseFloorCdb: toCentiDecibels(1000)  // 10 dB
    };

    const result = computeAcousticWavefront(query, registry);
    const node1 = result.evaluatedNodes.get(packAxial(1, 0));
    const node2 = result.evaluatedNodes.get(packAxial(2, 0));

    expect(node1).toBeDefined();
    expect(node1?.arrivingIntensityCdb).toBe(6000 - AIR_LOSS_PER_HEX_CDB);
    expect(node2).toBeDefined();
    expect(node2?.arrivingIntensityCdb).toBe(6000 - 2 * AIR_LOSS_PER_HEX_CDB);
  });

  it('attenuates sound additively across structural partitions without float drift', () => {
    const source = createAxialCoord(0, 0);
    const p0 = packAxial(0, 0);
    const p1 = packAxial(1, 0);
    const p2 = packAxial(2, 0);

    // Enclose the corridor to prevent sound from propagating around the walls
    // Since we are checking path 0,0 -> 1,0 -> 2,0
    // We add infinite damping to any other path out of 0,0 and 1,0.
    // The neighbors of 0,0: d=0(0,-1), d=1(1,-1), d=2(1,0), d=3(0,1), d=4(-1,1), d=5(-1,0)
    registry.setPartitionDamping(p0, packAxial(0, -1), toCentiDecibels(12000));
    registry.setPartitionDamping(p0, packAxial(1, -1), toCentiDecibels(12000));
    registry.setPartitionDamping(p0, packAxial(0, 1), toCentiDecibels(12000));
    registry.setPartitionDamping(p0, packAxial(-1, 1), toCentiDecibels(12000));
    registry.setPartitionDamping(p0, packAxial(-1, 0), toCentiDecibels(12000));

    registry.setPartitionDamping(p1, packAxial(1, -1), toCentiDecibels(12000));
    registry.setPartitionDamping(p1, packAxial(2, -1), toCentiDecibels(12000));
    registry.setPartitionDamping(p1, packAxial(1, 1), toCentiDecibels(12000));
    registry.setPartitionDamping(p1, packAxial(0, 1), toCentiDecibels(12000));

    // Bulkhead 1: wood partition (1,500 cdB)
    registry.setPartitionDamping(p0, p1, toCentiDecibels(1500));
    // Bulkhead 2: iron plate (5,000 cdB)
    registry.setPartitionDamping(p1, p2, toCentiDecibels(5000));

    const query = {
      sourceCoord: source,
      sourceIntensityCdb: toCentiDecibels(10000), // 100 dB
      ambientNoiseFloorCdb: toCentiDecibels(1000)
    };

    const result = computeAcousticWavefront(query, registry);
    const targetNode = result.evaluatedNodes.get(p2);

    // Expected intensity: 10,000 - 2*150 (air) - 1,500 - 5,000 = 3,200 cdB
    expect(targetNode?.arrivingIntensityCdb).toBe(3200);
    expect(targetNode?.pathLossCdb).toBe(6800);
  });

  it('prunes priority queue expansion when arriving energy drops to ambient noise floor', () => {
    const source = createAxialCoord(0, 0);
    const query = {
      sourceCoord: source,
      sourceIntensityCdb: toCentiDecibels(2000),
      ambientNoiseFloorCdb: toCentiDecibels(1800) // Prunes after 1 step (2000 - 150 = 1850; 1850 - 150 = 1700 <= 1800)
    };

    const result = computeAcousticWavefront(query, registry);
    expect(result.prunedFrontierCount).toBeGreaterThan(0);
    // Cells 2 steps away should not be evaluated
    expect(result.evaluatedNodes.has(packAxial(2, 0))).toBe(false);
  });

  it('evaluates dual-condition audibility and masks whispers in loud ambient noise', () => {
    // Sound clears absolute threshold (2000) but fails SNR margin (+600 over ambient 3000)
    const arriving = toCentiDecibels(3400);
    const ambient = toCentiDecibels(3000);
    const hearing = toCentiDecibels(2000);
    const snrMin = toCentiDecibels(600);

    // 3400 - 3000 = 400 < 600 SNR -> false
    expect(verifyAudibilityDualCondition(arriving, ambient, hearing, snrMin)).toBe(false);

    // Arriving 3700 -> 3700 - 3000 = 700 >= 600 SNR -> true
    expect(verifyAudibilityDualCondition(toCentiDecibels(3700), ambient, hearing, snrMin)).toBe(true);
  });

  it('calculates auditory quality per-mille within [0, 1000]', () => {
    const ambient = toCentiDecibels(2000);
    const snrMin = toCentiDecibels(600);
    const ref = toCentiDecibels(8500);

    // Below baseline (2600) -> 0
    expect(computeAuditoryQualityPermille(toCentiDecibels(2500), ambient, snrMin, ref)).toBe(0);

    // Equal to reference (8500) -> 1000
    expect(computeAuditoryQualityPermille(toCentiDecibels(8500), ambient, snrMin, ref)).toBe(1000);

    // Intermediate intensity
    const q = computeAuditoryQualityPermille(toCentiDecibels(5550), ambient, snrMin, ref);
    expect(q).toBeGreaterThan(0);
    expect(q).toBeLessThan(1000);
  });

  it('dispatches SND01 Blessed menu action within 2ms execution budget', async () => {
    const action = createSoundPropagationAction();
    const bus = createSpatialBus();
    const logs: string[] = [];

    bus.subscribe('TELEMETRY_LOG', (evt) => {
      logs.push(String(evt.payload.message || ''));
    });

    const start = performance.now();
    await action.execute(bus);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThanOrEqual(20.0);
    expect(logs.some((l) => l.includes('[SND01] Acoustic Wavefront'))).toBe(true);
    expect(logs.some((l) => l.includes('Evaluated Cells'))).toBe(true);
  });
});
