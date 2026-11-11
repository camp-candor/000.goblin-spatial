import { createHash } from 'node:crypto';
import { LedgerModel } from '../ledger.model.js';
import type LedgerBit from '../fce/ledger.bit.js';
import type State from '../../99.core/state.js';
import {
  SpatialAuditQuadruple,
  SpatialLedgerEntry,
  LineageVerificationResult,
} from '../fce/ledger.interface.js';
import {
  GENESIS_HASH_64,
  SpatialAuditQuadrupleSchema,
  SpatialLedgerEntrySchema,
} from '../val/ledger.model.js';

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) Serializer.
 * Enforces lexicographical key sorting by UTF-16 code units and Unicode NFC normalization.
 */
export function canonicalizeJson(obj: unknown): string {

  if (obj === undefined) return '';
  if (obj === null) return 'null';


  if (typeof obj === 'number') {
    if (!Number.isFinite(obj)) {
      throw new TypeError('[CANONICALIZE_ERROR] Non-finite IEEE-754 numbers are prohibited');
    }
    return obj.toString();
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj.normalize('NFC'));
  }

  if (Array.isArray(obj)) {
    return `[${obj.map((el) => canonicalizeJson(el)).join(',')}]`;
  }

  if (typeof obj === 'object') {
    const objDict = obj as Record<string, unknown>;
    const sortedKeys = Object.keys(objDict)
      .filter((key) => objDict[key] !== undefined)
      .sort((a, b) => {
      const minLen = Math.min(a.length, b.length);
      for (let i = 0; i < minLen; i++) {
        const codeA = a.charCodeAt(i);
        const codeB = b.charCodeAt(i);
        if (codeA !== codeB) return codeA - codeB;
      }
      return a.length - b.length;
    });

    const entries = sortedKeys.map(
      (key) => `${JSON.stringify(key.normalize('NFC'))}:${canonicalizeJson((obj as any)[key])}`
    );
    return `{${entries.join(',')}}`;
  }

  throw new TypeError(`[CANONICALIZE_ERROR] Unsupported datatype: ${typeof obj}`);
}

export function computeSha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Computes chained event hash: SHA-256(prevEventHash || CanonicalJCS(entryWithoutHash)).
 */
export function sealLedgerEntry(
  entryWithoutHash: Omit<SpatialLedgerEntry, 'chainedEventHash'>
): SpatialLedgerEntry {
  const canonicalPayload = canonicalizeJson(entryWithoutHash);
  const chainedEventHash = computeSha256Hex(`${entryWithoutHash.prevEventHash}${canonicalPayload}`);

  return Object.freeze({
    ...entryWithoutHash,
    chainedEventHash,
  });
}

/**
 * Validates cryptographic lineage across entire recorded ledger entries.
 */
export function verifyLedgerLineage(entries: readonly SpatialLedgerEntry[]): LineageVerificationResult {
  if (entries.length === 0) {
    return { valid: true, totalEntries: 0 };
  }

  let expectedPrevHash = GENESIS_HASH_64;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedSequence = i + 1;

    if (entry.sequenceNumber !== expectedSequence) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenSequenceIndex: i,
        failureReason: `[SEQUENCE_DISCONTINUITY] Expected sequence ${expectedSequence}, found ${entry.sequenceNumber}`,
      };
    }

    if (entry.prevEventHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenSequenceIndex: i,
        expectedHash: expectedPrevHash,
        actualHash: entry.prevEventHash,
        failureReason: `[PREV_HASH_MISMATCH] Entry ${i + 1} prevEventHash does not match expected lineage`,
      };
    }

    const { chainedEventHash, ...payloadWithoutHash } = entry;
    const recalculatedHash = computeSha256Hex(`${entry.prevEventHash}${canonicalizeJson(payloadWithoutHash)}`);

    if (recalculatedHash !== chainedEventHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenSequenceIndex: i,
        expectedHash: recalculatedHash,
        actualHash: chainedEventHash,
        failureReason: `[CHAIN_HASH_CORRUPTION] Entry ${i + 1} hash tampering detected`,
      };
    }

    expectedPrevHash = chainedEventHash;
  }

  return { valid: true, totalEntries: entries.length };
}

export const initLedger = (
  cpy: LedgerModel,
  bal?: LedgerBit,
  ste?: State
): LedgerModel => {
  cpy.headSequence = 0;
  cpy.lastEventHash = GENESIS_HASH_64;
  cpy.totalEntriesCommitted = 0;
  cpy.entries = Object.freeze([]);

  if (bal?.slv) {
    bal.slv({ ldgBit: { idx: 'init-ledger-success', val: 1 } });
  }
  return cpy;
};

export const appendEntry = (
  cpy: LedgerModel,
  bal?: LedgerBit,
  ste?: State
): LedgerModel => {
  const quadruple = bal?.dat?.auditQuadruple;
  const queryType = bal?.dat?.queryType ?? 'RAYCAST';
  const tickNumber = bal?.dat?.tickNumber ?? 0;
  const streamId = bal?.dat?.streamId ?? 'spatial-default-stream';

  const quadParsed = SpatialAuditQuadrupleSchema.safeParse(quadruple);
  if (!quadParsed.success) {
    if (bal?.slv) {
      bal.slv({
        ldgBit: {
          idx: 'append-entry-fail',
          val: 0,
          dat: { error: `[QUADRUPLE_SCHEMA_BREACH] ${quadParsed.error.errors.map((e) => e.message).join('; ')}` },
        },
      });
    }
    return cpy;
  }

  const nextSequence = cpy.headSequence + 1;
  const unsealedEntry: Omit<SpatialLedgerEntry, 'chainedEventHash'> = {
    sequenceNumber: nextSequence,
    tickNumber,
    streamId,
    queryType,
    auditQuadruple: quadParsed.data as SpatialAuditQuadruple,
    kernelVersion: 'v1.0.0-spatial-oracle',
    prevEventHash: cpy.lastEventHash,
    recordedAtMs: Date.now(),
  };

  const sealedEntry = sealLedgerEntry(unsealedEntry);

  const validatedEntryResult = SpatialLedgerEntrySchema.safeParse(sealedEntry);
  if (!validatedEntryResult.success) {
    if (bal?.slv) {
      bal.slv({
        ldgBit: {
          idx: 'append-entry-fail',
          val: 0,
          dat: { error: `[ENTRY_SCHEMA_BREACH] ${validatedEntryResult.error.errors.map((e) => e.message).join('; ')}` },
        },
      });
    }
    return cpy;
  }
  const validatedEntry = validatedEntryResult.data as SpatialLedgerEntry;


  const updatedEntries = [...cpy.entries, validatedEntry];
  cpy.entries = Object.freeze(updatedEntries);
  cpy.headSequence = nextSequence;
  cpy.lastEventHash = sealedEntry.chainedEventHash;
  cpy.totalEntriesCommitted = updatedEntries.length;

  if (bal?.slv) {
    bal.slv({
      ldgBit: {
        idx: 'append-entry-success',
        val: 1,
        dat: { entry: validatedEntry },
      },
    });
  }
  return cpy;
};

export const verifyLineage = (
  cpy: LedgerModel,
  bal?: LedgerBit,
  ste?: State
): LedgerModel => {
  const result = verifyLedgerLineage(cpy.entries);

  if (bal?.slv) {
    bal.slv({
      ldgBit: {
        idx: result.valid ? 'verify-lineage-success' : 'verify-lineage-fail',
        val: result.valid ? 1 : 0,
        dat: { verificationResult: result, error: result.failureReason },
      },
    });
  }
  return cpy;
};
