import { describe, it, expect, beforeEach } from 'vitest';
import {
  canonicalizeJCS,
  sha256Hex,
  computeGenesisHash,
  createSpatialLedgerLogger,
  SpatialLedgerLogger,
  verifyLedgerIntegrity
} from '../19.ledger.unit/buz/ledger.buzz.js';
import { SpatialLedgerEntry } from '../19.ledger.unit/fce/ledger.interface.js';

describe('Task 8.3 Deterministic Query Hash Chain Ledger Logger', () => {
  let logger: SpatialLedgerLogger;
  const streamId = 'episode_test_chamber_01';

  beforeEach(() => {
    logger = createSpatialLedgerLogger({ streamId });
  });

  it('canonicalizes JSON payloads strictly in lexicographical key order (RFC 8785)', () => {
    const unorderedObj = {
      z_coord: 0,
      a_name: 'test_node',
      m_metadata: {
        y_val: 200,
        b_val: 100
      }
    };

    const jcs = canonicalizeJCS(unorderedObj);
    // Keys must appear in strict alphabetical order: a_name, m_metadata (b_val, y_val), z_coord
    expect(jcs).toBe(
      '{"a_name":"test_node","m_metadata":{"b_val":100,"y_val":200},"z_coord":0}'
    );
  });

  it('rejects floating-point non-integers during canonicalization', () => {
    expect(() => canonicalizeJCS({ floatVal: 45.5 })).toThrow(TypeError);
    expect(() => canonicalizeJCS({ nanVal: NaN })).toThrow(TypeError);
    expect(() => canonicalizeJCS({ infVal: Infinity })).toThrow(TypeError);
  });

  it('initializes genesis hash rooted in the streamId', () => {
    const expectedGenesis = sha256Hex(`GOBLIN-SPATIAL-GENESIS::${streamId}`);
    expect(logger.getGenesisHash()).toBe(expectedGenesis);
    expect(logger.getHeadHash()).toBe(expectedGenesis);
    expect(logger.getEntryCount()).toBe(0);
  });

  it('appends spatial transactions and mints recursive SHA-256 hash chains', () => {
    const query1 = { queryType: 'RAYCAST', origin: { q: 0, r: 0 }, target: { q: 1, r: 0 } };
    const receipt1 = { isVisible: true, transmissionBps: 10000 };

    const entry1 = logger.logTransaction(100, 'RAYCAST', query1, receipt1);

    expect(entry1.sequenceNumber).toBe(1);
    expect(entry1.occurredAtTick).toBe(100);
    expect(entry1.previousEventHash).toBe(logger.getGenesisHash());
    expect(entry1.eventHash).toMatch(/^[0-9a-f]{64}$/);
    expect(logger.getHeadHash()).toBe(entry1.eventHash);

    const query2 = { queryType: 'ACOUSTIC', source: { q: 0, r: 0 }, intensity: 8500 };
    const receipt2 = { isAudible: true, snrMarginCdb: 1200 };

    const entry2 = logger.logTransaction(105, 'ACOUSTIC_WAVEFRONT', query2, receipt2);

    expect(entry2.sequenceNumber).toBe(2);
    expect(entry2.occurredAtTick).toBe(105);
    expect(entry2.previousEventHash).toBe(entry1.eventHash);
    expect(logger.getHeadHash()).toBe(entry2.eventHash);
    expect(logger.getEntryCount()).toBe(2);
  });

  it('verifies 100% hash chain integrity on un-tampered logs', () => {
    logger.logTransaction(1, 'QUERY_A', { a: 1 }, { res: 10 });
    logger.logTransaction(2, 'QUERY_B', { b: 2 }, { res: 20 });
    logger.logTransaction(3, 'QUERY_C', { c: 3 }, { res: 30 });

    const audit = logger.verifyIntegrity();
    expect(audit.valid).toBe(true);
    expect(audit.totalEntries).toBe(3);
    expect(audit.headHash).toBe(logger.getHeadHash());
    expect(audit.error).toBeUndefined();
  });

  it('detects tampering and hash divergence when an entry payload is mutated', () => {
    logger.logTransaction(1, 'STEP_1', { step: 1 }, { cost: 100 });
    logger.logTransaction(2, 'STEP_2', { step: 2 }, { cost: 200 });
    logger.logTransaction(3, 'STEP_3', { step: 3 }, { cost: 300 });

    const entries = [...logger.getEntries()] as SpatialLedgerEntry[];

    // Simulate tampering: retroactively mutate entry 2's queryHash
    const tamperedEntry: SpatialLedgerEntry = {
      ...entries[1],
      auditQuadruple: {
        ...entries[1].auditQuadruple,
        queryHash: sha256Hex('FORGED_QUERY_DATA')
      }
    };
    entries[1] = tamperedEntry;

    const audit = verifyLedgerIntegrity(entries, streamId);
    expect(audit.valid).toBe(false);
    expect(audit.brokenSequenceIndex).toBe(1);
    expect(audit.error).toContain('BLOCK_HASH_DIVERGENCE');
  });

  it('detects sequence gap errors when an event is omitted', () => {
    logger.logTransaction(1, 'STEP_1', { step: 1 }, { cost: 100 });
    logger.logTransaction(2, 'STEP_2', { step: 2 }, { cost: 200 });
    logger.logTransaction(3, 'STEP_3', { step: 3 }, { cost: 300 });

    const entries = logger.getEntries();
    // Drop entry 2 (seq 2)
    const gappedEntries = [entries[0], entries[2]];

    const audit = verifyLedgerIntegrity(gappedEntries, streamId);
    expect(audit.valid).toBe(false);
    expect(audit.brokenSequenceIndex).toBe(1);
    expect(audit.error).toContain('SEQUENCE_GAP_DETECTED');
  });

  it('exports valid newline-delimited JSON (ndjson)', () => {
    logger.logTransaction(1, 'TEST_A', { q: 1 }, { r: 1 });
    logger.logTransaction(2, 'TEST_B', { q: 2 }, { r: 2 });

    const ndjson = logger.exportNdjson();
    const lines = ndjson.split('\n');
    expect(lines.length).toBe(2);

    const parsedFirst = JSON.parse(lines[0]);
    expect(parsedFirst.sequenceNumber).toBe(1);
    expect(parsedFirst.eventHash).toBe(logger.getEntries()[0].eventHash);
  });

  it('enforces deep-freeze runtime immutability on returned entries', () => {
    const entry = logger.logTransaction(1, 'IMMUTABLE_TEST', { test: 1 }, { ok: true });

    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.auditQuadruple)).toBe(true);

    expect(() => {
      // @ts-expect-error - testing immutability
      entry.sequenceNumber = 999;
    }).toThrow(TypeError);
  });
});
