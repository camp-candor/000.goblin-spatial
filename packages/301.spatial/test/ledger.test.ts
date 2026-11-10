import { describe, it, expect } from 'vitest';
import {
    canonicalizeJCS,
    computeGenesisHash,
    SpatialLedgerLogger,
    verifyLedgerIntegrity
} from '../19.ledger.unit/buz/ledger.buzz.js';
import { SpatialAuditQuadruple } from '../19.ledger.unit/fce/ledger.interface.js';

describe('Spatial Ledger Unit Tests', () => {
    it('should correctly canonicalize objects using RFC 8785 (lexicographical key sorting)', () => {
        const obj1 = { b: 2, a: 1, c: { e: 5, d: 4 } };
        const obj2 = { c: { d: 4, e: 5 }, a: 1, b: 2 };

        expect(canonicalizeJCS(obj1)).toBe('{"a":1,"b":2,"c":{"d":4,"e":5}}');
        expect(canonicalizeJCS(obj2)).toBe('{"a":1,"b":2,"c":{"d":4,"e":5}}');
    });

    it('should strictly reject non-integer floats and invalid numbers during canonicalization', () => {
        expect(() => canonicalizeJCS({ a: 1.5 })).toThrow(/Floats are not permitted/);
        expect(() => canonicalizeJCS({ a: NaN })).toThrow(/Invalid number/);
        expect(() => canonicalizeJCS({ a: Infinity })).toThrow(/Invalid number/);
        expect(() => canonicalizeJCS({ a: -Infinity })).toThrow(/Invalid number/);
    });

    it('should compute stream-rooted genesis seeding deterministically', () => {
        const h0_1 = computeGenesisHash('stream-alpha');
        const h0_2 = computeGenesisHash('stream-alpha');
        const h0_diff = computeGenesisHash('stream-beta');

        expect(h0_1).toBe(h0_2);
        expect(h0_1).not.toBe(h0_diff);
        expect(h0_1).toHaveLength(64);
    });

    it('should monotonically increment sequences, construct recursive SHA-256 hash chains, and detect full-chain tampering', () => {
        const streamId = 'stream-test';
        const logger = new SpatialLedgerLogger({ streamId });

        const q1: SpatialAuditQuadruple = {
            topologyHash: 'a'.repeat(64),
            overlayHash: 'b'.repeat(64),
            queryHash: 'c'.repeat(64),
            receiptHash: 'd'.repeat(64),
        };
        const q2: SpatialAuditQuadruple = {
            topologyHash: 'e'.repeat(64),
            overlayHash: 'f'.repeat(64),
            queryHash: 'g'.repeat(64),
            receiptHash: 'h'.repeat(64),
        };

        const entry1 = logger.append(100, 'type1', q1);
        const entry2 = logger.append(101, 'type2', q2);

        expect(entry1.seq).toBe(1);
        expect(entry2.seq).toBe(2);

        const history = logger.getHistory();
        expect(history).toHaveLength(2);

        // Deep-freeze immutability check
        expect(Object.isFrozen(entry1)).toBe(true);
        expect(Object.isFrozen(entry1.quadruple)).toBe(true);

        // Positive verification
        const genesisHash = computeGenesisHash(streamId);
        const resultGood = verifyLedgerIntegrity(history, genesisHash);
        expect(resultGood.isValid).toBe(true);
        expect(resultGood.sequenceGaps).toBe(0);
        expect(resultGood.hashMismatches).toBe(0);

        // Tamper test: payload mutation
        const tamperedHistory = [...history];
        const tamperedEntry = { ...entry2, queryType: 'type3' }; // mutating the payload but not eventHash
        tamperedHistory[1] = tamperedEntry;
        const resultBadHash = verifyLedgerIntegrity(tamperedHistory, genesisHash);
        expect(resultBadHash.isValid).toBe(false);
        expect(resultBadHash.hashMismatches).toBe(1);

        // Tamper test: sequence gap detection
        const gappedHistory = [entry1, { ...entry2, seq: 3, eventHash: entry2.eventHash }];
        const resultGap = verifyLedgerIntegrity(gappedHistory as any, genesisHash);
        expect(resultGap.isValid).toBe(false);
        expect(resultGap.sequenceGaps).toBe(1);
    });

    it('should correctly export to .ndjson format', () => {
        const streamId = 'stream-ndjson';
        const logger = new SpatialLedgerLogger({ streamId });

        const q: SpatialAuditQuadruple = {
            topologyHash: '1'.repeat(64),
            overlayHash: '2'.repeat(64),
            queryHash: '3'.repeat(64),
            receiptHash: '4'.repeat(64),
        };

        logger.append(10, 'ndjsonType', q);
        logger.append(11, 'ndjsonType', q);

        const output = logger.exportNdjson();
        const lines = output.split('\n');

        expect(lines).toHaveLength(2);
        const parsed = JSON.parse(lines[0]);
        expect(parsed.seq).toBe(1);
        expect(parsed.queryType).toBe('ndjsonType');
    });
});
