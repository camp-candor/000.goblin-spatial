import crypto from 'node:crypto'
import { LedgerModel, DEFAULT_KERNEL_VERSION, GENESIS_PREFIX } from '../val/ledger.model.js'
import LedgerBit from '../fce/ledger.bit.js'
import State from '../../99.core/state.js'
import { SpatialAuditQuadruple, SpatialLedgerEntry, HashChainVerificationResult, LedgerLoggerOptions } from '../fce/ledger.interface.js'

export const initLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State) => {
    debugger
    return cpy
}

export const updateLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State) => {
    return cpy
}

export function canonicalizeJCS(obj: any): string {
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj ? 'true' : 'false';
    if (typeof obj === 'string') return JSON.stringify(obj);
    if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) {
            throw new Error('NaN or Infinity not allowed in RFC 8785');
        }
        if (Object.is(obj, -0)) return '0';
        return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
        return '[' + obj.map(item => canonicalizeJCS(item === undefined ? null : item)).join(',') + ']';
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort((a, b) => {
            const a16 = Buffer.from(a, 'utf16le');
            const b16 = Buffer.from(b, 'utf16le');
            return a16.compare(b16);
        });
        const keyValues = [];
        for (const k of keys) {
            if (obj[k] !== undefined) {
                keyValues.push(JSON.stringify(k) + ':' + canonicalizeJCS(obj[k]));
            }
        }
        return '{' + keyValues.join(',') + '}';
    }
    throw new Error('Unsupported type');
}

export function sha256Hex(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

export function computeGenesisHash(streamId: string): string {
    return sha256Hex(`${GENESIS_PREFIX}${streamId}`);
}

export function mintEntryHash(
    prevHash: string,
    seq: number,
    tick: number,
    streamId: string,
    queryType: string,
    quadruple: SpatialAuditQuadruple,
    kernelVersion: string
): string {
    return sha256Hex(
        prevHash +
        seq.toString() +
        tick.toString() +
        streamId +
        queryType +
        canonicalizeJCS(quadruple) +
        kernelVersion
    );
}

export class SpatialLedgerLogger {
    private streamId: string;
    private kernelVersion: string;
    private headHash: string;
    private entries: SpatialLedgerEntry[] = [];
    private seqCounter: number = 0;

    constructor(options: LedgerLoggerOptions) {
        this.streamId = options.streamId;
        this.kernelVersion = options.kernelVersion || DEFAULT_KERNEL_VERSION;
        this.headHash = computeGenesisHash(this.streamId);
    }

    public getGenesisHash(): string {
        return computeGenesisHash(this.streamId);
    }

    public getHeadHash(): string {
        return this.headHash;
    }

    public getEntries(): readonly SpatialLedgerEntry[] {
        return this.entries;
    }

    public appendEntry(
        tick: number,
        queryType: string,
        quadruple: SpatialAuditQuadruple
    ): SpatialLedgerEntry {
        this.seqCounter++;
        const eventHash = mintEntryHash(
            this.headHash,
            this.seqCounter,
            tick,
            this.streamId,
            queryType,
            quadruple,
            this.kernelVersion
        );

        const entry: SpatialLedgerEntry = {
            seq: this.seqCounter,
            tick,
            streamId: this.streamId,
            queryType,
            quadruple,
            kernelVersion: this.kernelVersion,
            eventHash
        };

        Object.freeze(entry.quadruple);
        Object.freeze(entry);

        this.entries.push(entry);
        this.headHash = eventHash;
        return entry;
    }
}

export function createSpatialLedgerLogger(options: LedgerLoggerOptions): SpatialLedgerLogger {
    return new SpatialLedgerLogger(options);
}

export function verifyLedgerIntegrity(entries: SpatialLedgerEntry[], streamId: string): HashChainVerificationResult {
    if (entries.length === 0) return { valid: true };

    let currentHash = computeGenesisHash(streamId);
    let expectedSeq = 1;

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (entry.seq !== expectedSeq) {
            return {
                valid: false,
                error: `Sequence gap detected at index ${i}`,
                invalidSequenceIdx: i
            };
        }

        const expectedHash = mintEntryHash(
            currentHash,
            entry.seq,
            entry.tick,
            entry.streamId,
            entry.queryType,
            entry.quadruple,
            entry.kernelVersion
        );

        if (entry.eventHash !== expectedHash) {
            return {
                valid: false,
                error: `Hash mismatch at sequence ${entry.seq}`,
                invalidSequenceIdx: i
            };
        }

        currentHash = entry.eventHash;
        expectedSeq++;
    }

    return { valid: true };
}
