import { describe, it, expect, beforeEach } from 'vitest';
import { LedgerModel } from '../ledger.model.js';
import {
  canonicalizeJson,
  computeSha256Hex,
  sealLedgerEntry,
  verifyLedgerLineage,
  initLedger,
  appendEntry,
  verifyLineage,
} from '../buz/ledger.buzz.js';
import { GENESIS_HASH_64 } from '../val/ledger.model.js';
import type LedgerBit from '../fce/ledger.bit.js';

describe('19.ledger.unit - Cryptographic Audit Quadruple Ledger', () => {
  let model: LedgerModel;

  beforeEach(() => {
    model = new LedgerModel();
    initLedger(model);
  });

  describe('RFC 8785 JSON Canonicalization Scheme (JCS)', () => {
    it('sorts keys lexicographically by UTF-16 code units', () => {
      const objA = { z: 1, a: 2, m: 3 };
      const objB = { a: 2, m: 3, z: 1 };
      expect(canonicalizeJson(objA)).toBe('{"a":2,"m":3,"z":1}');
      expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB));
    });

    it('enforces Unicode Normalization Form C (NFC)', () => {
      const decomposed = 'e\u0301'; // e + combining acute
      const precomposed = '\u00e9'; // e with acute
      expect(canonicalizeJson({ text: decomposed })).toBe(canonicalizeJson({ text: precomposed }));
    });

    it('rejects non-finite IEEE-754 numbers with TypeError', () => {
      expect(() => canonicalizeJson({ val: NaN })).toThrow('[CANONICALIZE_ERROR]');
      expect(() => canonicalizeJson({ val: Infinity })).toThrow('[CANONICALIZE_ERROR]');
    });
  });

  describe('Spatial Audit Quadruple Contract & Lineage Sealing', () => {
    const validQuadruple = {
      topologyHash: 'a'.repeat(64),
      overlayHash: 'b'.repeat(64),
      queryHash: 'c'.repeat(64),
      receiptHash: 'd'.repeat(64),
    };

    it('seals Genesis Sequence #1 linked to GENESIS_HASH_64', () => {
      let emittedEntry: any = null;

      const bale: LedgerBit = {
        idx: 'append-1',
        dat: {
          queryType: 'RAYCAST',
          tickNumber: 0,
          streamId: 'stream-alpha',
          auditQuadruple: validQuadruple,
        },
        slv: (res) => {
          emittedEntry = res.ldgBit.dat?.entry;
        },
      };

      appendEntry(model, bale);

      expect(emittedEntry).toBeDefined();
      expect(emittedEntry.sequenceNumber).toBe(1);
      expect(emittedEntry.prevEventHash).toBe(GENESIS_HASH_64);
      expect(emittedEntry.chainedEventHash).toMatch(/^[a-f0-9]{64}$/);
      expect(model.headSequence).toBe(1);
      expect(model.lastEventHash).toBe(emittedEntry.chainedEventHash);
    });

    it('appends multiple entries in unbroken cryptographic hash chain', () => {
      for (let i = 0; i < 3; i++) {
        const bale: LedgerBit = {
          idx: `append-${i + 1}`,
          dat: {
            queryType: 'BOUNDED_PATH',
            tickNumber: i,
            streamId: 'stream-alpha',
            auditQuadruple: {
              topologyHash: `${i}`.repeat(64),
              overlayHash: 'b'.repeat(64),
              queryHash: 'c'.repeat(64),
              receiptHash: 'd'.repeat(64),
            },
          },
        };
        appendEntry(model, bale);
      }

      expect(model.headSequence).toBe(3);
      expect(model.entries.length).toBe(3);

      const verification = verifyLedgerLineage(model.entries);
      expect(verification.valid).toBe(true);
      expect(verification.totalEntries).toBe(3);
    });

    it('fails closed when an entry payload is tampered', () => {
      // Append two valid entries
      appendEntry(model, {
        idx: 'e1',
        dat: { queryType: 'RAYCAST', tickNumber: 1, streamId: 's', auditQuadruple: validQuadruple },
      });
      appendEntry(model, {
        idx: 'e2',
        dat: { queryType: 'RAYCAST', tickNumber: 2, streamId: 's', auditQuadruple: validQuadruple },
      });

      // Tamper entry 1 tickNumber
      const tamperedEntries = [...model.entries];
      (tamperedEntries[0] as any) = { ...tamperedEntries[0], tickNumber: 999 };

      const result = verifyLedgerLineage(tamperedEntries);
      expect(result.valid).toBe(false);
      expect(result.failureReason).toContain('[CHAIN_HASH_CORRUPTION]');
    });

    it('rejects invalid quadruple hash length or formatting via Zod schema', () => {
      let errorEmitted: any = null;

      const bale: LedgerBit = {
        idx: 'invalid-quad',
        dat: {
          queryType: 'RAYCAST',
          auditQuadruple: {
            topologyHash: 'short-hash',
            overlayHash: 'b'.repeat(64),
            queryHash: 'c'.repeat(64),
            receiptHash: 'd'.repeat(64),
          },
        },
        slv: (res) => {
          errorEmitted = res.ldgBit.dat?.error;
        },
      };

      appendEntry(model, bale);

      expect(errorEmitted).toContain('[QUADRUPLE_SCHEMA_BREACH]');
      expect(model.headSequence).toBe(0);
    });
  });
});
