import { createHash } from 'node:crypto';
import {
  HashChainVerificationResult,
  LedgerLoggerOptions,
  SpatialAuditQuadruple,
  SpatialLedgerEntry
} from '../fce/ledger.interface.js';
import {
  DEFAULT_KERNEL_VERSION,
  GENESIS_PREFIX,
  SpatialLedgerEntrySchema
} from '../val/ledger.model.js';

function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  Object.freeze(obj);
  for (const key of Object.keys(obj as object)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj as Readonly<T>;
}

/**
 * RFC 8785 JSON Canonicalization Scheme (JCS) Serializer.
 * - Recursively sorts object keys lexicographically by UTF-16 code units.
 * - Preserves array sequence order strictly.
 * - Minifies whitespace outside strings.
 * - Rejects floating-point non-integers, NaN, and Infinity.
 */
export function canonicalizeJCS(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || !Number.isInteger(value)) {
        throw new TypeError(`JCS_NON_INTEGER_OR_NON_FINITE: ${value}`);
      }
      return value.toString();
    }
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJCS(item)).join(',') + ']';
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const elements = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalizeJCS(record[key])}`
  );
  return '{' + elements.join(',') + '}';
}

/**
 * Computes lowercase 64-char SHA-256 digest of arbitrary UTF-8 string.
 */
export function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Computes deterministic genesis root hash for a given streamId:
 * H_0 = SHA-256("GOBLIN-SPATIAL-GENESIS::" || streamId)
 */
export function computeGenesisHash(streamId: string): string {
  return sha256Hex(`${GENESIS_PREFIX}${streamId}`);
}

/**
 * Mints recursive SHA-256 block hash for an entry:
 * H_n = SHA-256(H_{n-1} || "::" || seq || "::" || tick || "::" || streamId || "::" || queryType || "::" || CanonicalJCS(quadruple) || "::" || kernelVersion)
 */
export function mintEntryHash(
  previousHash: string,
  sequenceNumber: number,
  occurredAtTick: number,
  streamId: string,
  queryType: string,
  auditQuadruple: SpatialAuditQuadruple,
  kernelVersion: string
): string {
  const quadrupleJCS = canonicalizeJCS(auditQuadruple);
  const hashPayload = [
    previousHash,
    sequenceNumber.toString(),
    occurredAtTick.toString(),
    streamId,
    queryType,
    quadrupleJCS,
    kernelVersion
  ].join('::');

  return sha256Hex(hashPayload);
}

export class SpatialLedgerLogger {
  private readonly streamId: string;
  private readonly kernelVersion: string;
  private readonly genesisHash: string;
  private currentHeadHash: string;
  private sequenceCounter: number;
  private readonly entries: SpatialLedgerEntry[] = [];

  constructor(options: LedgerLoggerOptions) {
    this.streamId = options.streamId;
    this.kernelVersion = options.kernelVersion ?? DEFAULT_KERNEL_VERSION;
    this.genesisHash = computeGenesisHash(this.streamId);
    this.currentHeadHash = this.genesisHash;
    this.sequenceCounter = 0;
  }

  public getStreamId(): string {
    return this.streamId;
  }

  public getHeadHash(): string {
    return this.currentHeadHash;
  }

  public getGenesisHash(): string {
    return this.genesisHash;
  }

  public getEntryCount(): number {
    return this.entries.length;
  }

  public getEntries(): readonly SpatialLedgerEntry[] {
    return this.entries;
  }

  /**
   * Appends a new verified spatial transaction into the immutable Merkle chain.
   */
  public logTransaction(
    occurredAtTick: number,
    queryType: string,
    rawQuery: unknown,
    rawReceipt: unknown,
    contextHashes?: { topologyHash?: string; overlayHash?: string }
  ): SpatialLedgerEntry {
    this.sequenceCounter++;
    const sequenceNumber = this.sequenceCounter;

    const queryJCS = canonicalizeJCS(rawQuery);
    const receiptJCS = canonicalizeJCS(rawReceipt);

    const queryHash = sha256Hex(queryJCS);
    const receiptHash = sha256Hex(receiptJCS);

    const topologyHash =
      contextHashes?.topologyHash ?? sha256Hex('TOPOLOGY_DEFAULT_CANONICAL');
    const overlayHash =
      contextHashes?.overlayHash ?? sha256Hex('OVERLAY_EMPTY_IDENTITY');

    const auditQuadruple: SpatialAuditQuadruple = {
      topologyHash,
      overlayHash,
      queryHash,
      receiptHash
    };

    const previousEventHash = this.currentHeadHash;
    const eventHash = mintEntryHash(
      previousEventHash,
      sequenceNumber,
      occurredAtTick,
      this.streamId,
      queryType,
      auditQuadruple,
      this.kernelVersion
    );

    const entryCandidate: SpatialLedgerEntry = {
      sequenceNumber,
      occurredAtTick,
      streamId: this.streamId,
      queryType,
      auditQuadruple,
      kernelVersion: this.kernelVersion,
      previousEventHash,
      eventHash
    };

    const parsedEntry = SpatialLedgerEntrySchema.parse(entryCandidate);
    const sealedEntry = deepFreeze(parsedEntry) as SpatialLedgerEntry;

    this.entries.push(sealedEntry);
    this.currentHeadHash = eventHash;

    return sealedEntry;
  }

  /**
   * Audits the entire internal hash chain from genesis to head.
   */
  public verifyIntegrity(): HashChainVerificationResult {
    return verifyLedgerIntegrity(this.entries, this.streamId);
  }

  /**
   * Exports the ledger entries as Newline-Delimited JSON (.ndjson).
   */
  public exportNdjson(): string {
    return this.entries.map((e) => JSON.stringify(e)).join('\n');
  }
}

/**
 * Verifies any arbitrary sequence of ledger entries against genesis and RFC 8785 chaining rules.
 */
export function verifyLedgerIntegrity(
  entries: readonly SpatialLedgerEntry[],
  streamId: string
): HashChainVerificationResult {
  const genesisHash = computeGenesisHash(streamId);
  let expectedPrevHash = genesisHash;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedSeq = i + 1;

    if (entry.sequenceNumber !== expectedSeq) {
      return {
        valid: false,
        totalEntries: entries.length,
        genesisHash,
        headHash: expectedPrevHash,
        brokenSequenceIndex: i,
        error: `SEQUENCE_GAP_DETECTED: Expected seq ${expectedSeq}, got ${entry.sequenceNumber}`
      };
    }

    if (entry.previousEventHash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        genesisHash,
        headHash: expectedPrevHash,
        brokenSequenceIndex: i,
        error: `PREVIOUS_HASH_MISMATCH: Entry ${entry.sequenceNumber} declared prev ${entry.previousEventHash}, expected ${expectedPrevHash}`
      };
    }

    const recalculatedHash = mintEntryHash(
      entry.previousEventHash,
      entry.sequenceNumber,
      entry.occurredAtTick,
      entry.streamId,
      entry.queryType,
      entry.auditQuadruple,
      entry.kernelVersion
    );

    if (entry.eventHash !== recalculatedHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        genesisHash,
        headHash: expectedPrevHash,
        brokenSequenceIndex: i,
        error: `BLOCK_HASH_DIVERGENCE: Entry ${entry.sequenceNumber} hash ${entry.eventHash} != computed ${recalculatedHash}`
      };
    }

    expectedPrevHash = entry.eventHash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    genesisHash,
    headHash: expectedPrevHash
  };
}

export const createSpatialLedgerLogger = (
  options: LedgerLoggerOptions
): SpatialLedgerLogger => new SpatialLedgerLogger(options);
