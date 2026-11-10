import { describe, it, expect } from 'vitest'
import {
    canonicalizeJCS,
    createSpatialLedgerLogger,
    verifyLedgerIntegrity,
    computeGenesisHash
} from '../19.ledger.unit/buz/ledger.buzz.js'
import { SpatialAuditQuadruple } from '../19.ledger.unit/fce/ledger.interface.js'
import { DEFAULT_KERNEL_VERSION } from '../19.ledger.unit/val/ledger.model.js'

describe('Deterministic Query Hash Chain Ledger Logger', () => {

    describe('RFC 8785 JSON Canonicalization Scheme', () => {
        it('should sort object keys lexicographically by UTF-16 code units', () => {
            const obj = { z: 1, a: 2, '\u20AC': 3 };
            // UTF-16: 'a' is 0x0061, 'z' is 0x007A, '\u20AC' is 0x20AC
            const canonical = canonicalizeJCS(obj);
            expect(canonical).toBe('{"a":2,"z":1,"\u20AC":3}');
        });

        it('should reject non-integer/float values like Infinity and NaN', () => {
            expect(() => canonicalizeJCS(Infinity)).toThrow('NaN or Infinity not allowed in RFC 8785');
            expect(() => canonicalizeJCS(NaN)).toThrow('NaN or Infinity not allowed in RFC 8785');
        });

        it('should convert -0 to 0', () => {
            expect(canonicalizeJCS(-0)).toBe('0');
        });
    });

    describe('Cryptographic Hash-Chain Recurrence', () => {
        it('should seed the chain root using computeGenesisHash', () => {
            const streamId = 'stream-001';
            const logger = createSpatialLedgerLogger({ streamId });

            expect(logger.getGenesisHash()).toBe(computeGenesisHash(streamId));
            expect(logger.getHeadHash()).toBe(logger.getGenesisHash());
        });

        it('should compute monotonically incrementing sequence indices', () => {
            const streamId = 'stream-002';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            const entry1 = logger.appendEntry(1000, 'TEST_QUERY', quadruple);
            expect(entry1.seq).toBe(1);

            const entry2 = logger.appendEntry(1010, 'TEST_QUERY', quadruple);
            expect(entry2.seq).toBe(2);
        });

        it('should perform recursive SHA-256 hash chaining', () => {
            const streamId = 'stream-003';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            const entry1 = logger.appendEntry(1000, 'TEST_QUERY', quadruple);
            expect(entry1.eventHash).toBeDefined();
            expect(logger.getHeadHash()).toBe(entry1.eventHash);

            const entry2 = logger.appendEntry(1010, 'TEST_QUERY', quadruple);
            expect(entry2.eventHash).toBeDefined();
            expect(logger.getHeadHash()).toBe(entry2.eventHash);
            expect(entry1.eventHash).not.toBe(entry2.eventHash);
        });
    });

    describe('Full-chain tamper detection and verification', () => {
        it('should verify a valid hash chain', () => {
            const streamId = 'stream-004';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            logger.appendEntry(1000, 'TEST_QUERY_1', quadruple);
            logger.appendEntry(1010, 'TEST_QUERY_2', quadruple);

            const entries = logger.getEntries();
            const result = verifyLedgerIntegrity([...entries], streamId);
            expect(result.valid).toBe(true);
        });

        it('should detect a mutated payload', () => {
            const streamId = 'stream-005';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            logger.appendEntry(1000, 'TEST_QUERY_1', quadruple);
            logger.appendEntry(1010, 'TEST_QUERY_2', quadruple);

            const entries = Array.from(logger.getEntries());
            // Need to bypass deep freeze to mutate for testing tamper detection
            const tamperedEntry = { ...entries[0], tick: 9999 };
            entries[0] = tamperedEntry;

            const result = verifyLedgerIntegrity(entries, streamId);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Hash mismatch/);
        });

        it('should detect a sequence gap', () => {
            const streamId = 'stream-006';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            logger.appendEntry(1000, 'TEST_QUERY_1', quadruple);
            logger.appendEntry(1010, 'TEST_QUERY_2', quadruple);

            const entries = Array.from(logger.getEntries());
            // Tamper with sequence number
            const tamperedEntry = { ...entries[1], seq: 3 };
            entries[1] = tamperedEntry;

            const result = verifyLedgerIntegrity(entries, streamId);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/Sequence gap detected/);
        });
    });

    describe('Deep-freeze runtime immutability', () => {
        it('should freeze the ledger entry and quadruple', () => {
            const streamId = 'stream-007';
            const logger = createSpatialLedgerLogger({ streamId });

            const quadruple: SpatialAuditQuadruple = {
                topologyHash: 'a'.repeat(64),
                overlayHash: 'b'.repeat(64),
                queryHash: 'c'.repeat(64),
                receiptHash: 'd'.repeat(64)
            };

            const entry = logger.appendEntry(1000, 'TEST_QUERY', quadruple);

            expect(Object.isFrozen(entry)).toBe(true);
            expect(Object.isFrozen(entry.quadruple)).toBe(true);
        });
    });
});
