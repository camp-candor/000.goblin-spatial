import * as crypto from 'crypto';
import { LedgerModel, DEFAULT_KERNEL_VERSION, GENESIS_PREFIX } from '../val/ledger.model.js';
import LedgerBit from '../fce/ledger.bit.js';
import State from '../../99.core/state.js';
import { SpatialAuditQuadruple, SpatialLedgerEntry, LedgerLoggerOptions, HashChainVerificationResult } from '../fce/ledger.interface.js';

export const canonicalizeJCS = (obj: any): string => {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'boolean' || typeof obj === 'string') return JSON.stringify(obj);
    if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) {
            throw new Error("Invalid number in payload");
        }
        if (!Number.isInteger(obj)) {
            throw new Error("Floats are not permitted in spatial payloads");
        }
        return JSON.stringify(obj);
    }
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    if (Array.isArray(obj)) {
        const parts = obj.map(item => canonicalizeJCS(item));
        return `[${parts.join(',')}]`;
    }
    if (typeof obj === 'object') {
        const keys = Object.keys(obj).sort(); // Sorts by UTF-16 code unit
        const parts = keys.map(key => {
            const val = canonicalizeJCS(obj[key]);
            if (val === undefined) return null;
            return `${JSON.stringify(key)}:${val}`;
        }).filter(v => v !== null);
        return `{${parts.join(',')}}`;
    }
    throw new Error(`Unsupported type: ${typeof obj}`);
};

export const sha256Hex = (data: string): string => {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
};

export const computeGenesisHash = (streamId: string): string => {
    return sha256Hex(`${GENESIS_PREFIX}${streamId}`);
};

export const mintEntryHash = (
    prevHash: string,
    seq: number,
    tick: number,
    streamId: string,
    queryType: string,
    quadruple: SpatialAuditQuadruple,
    kernelVersion: string
): string => {
    const payload = `${prevHash}${seq}${tick}${streamId}${queryType}${canonicalizeJCS(quadruple)}${kernelVersion}`;
    return sha256Hex(payload);
};

export class SpatialLedgerLogger {
    private streamId: string;
    private genesisHash: string;
    private history: SpatialLedgerEntry[];

    constructor(options: LedgerLoggerOptions) {
        this.streamId = options.streamId;
        this.genesisHash = options.genesisHash || computeGenesisHash(this.streamId);
        this.history = [];
    }

    public append(
        tick: number,
        queryType: string,
        quadruple: SpatialAuditQuadruple,
        kernelVersion: string = DEFAULT_KERNEL_VERSION
    ): SpatialLedgerEntry {
        const seq = this.history.length + 1;
        const prevHash = this.history.length === 0 ? this.genesisHash : this.history[this.history.length - 1].eventHash;

        const eventHash = mintEntryHash(prevHash, seq, tick, this.streamId, queryType, quadruple, kernelVersion);

        const entry: SpatialLedgerEntry = {
            seq,
            tick,
            streamId: this.streamId,
            queryType,
            kernelVersion,
            quadruple,
            eventHash
        };

        Object.freeze(entry.quadruple);
        Object.freeze(entry);

        this.history.push(entry);
        return entry;
    }

    public getHistory(): SpatialLedgerEntry[] {
        return this.history;
    }

    public exportNdjson(): string {
        return this.history.map(entry => JSON.stringify(entry)).join('\n');
    }
}

export const createSpatialLedgerLogger = (options: LedgerLoggerOptions): SpatialLedgerLogger => {
    return new SpatialLedgerLogger(options);
};

export const verifyLedgerIntegrity = (entries: SpatialLedgerEntry[], genesisHash: string): HashChainVerificationResult => {
    let sequenceGaps = 0;
    let hashMismatches = 0;

    let expectedSeq = 1;
    let prevHash = genesisHash;

    for (const entry of entries) {
        if (entry.seq !== expectedSeq) {
            sequenceGaps++;
        }

        const computedHash = mintEntryHash(
            prevHash,
            entry.seq,
            entry.tick,
            entry.streamId,
            entry.queryType,
            entry.quadruple,
            entry.kernelVersion
        );

        if (computedHash !== entry.eventHash) {
            hashMismatches++;
        }

        prevHash = entry.eventHash;
        expectedSeq = entry.seq + 1;
    }

    const isValid = sequenceGaps === 0 && hashMismatches === 0;

    return {
        isValid,
        sequenceGaps,
        hashMismatches,
        error: isValid ? undefined : `Integrity violation: ${sequenceGaps} sequence gaps, ${hashMismatches} hash mismatches`
    };
};

export const initLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State) => {
    debugger;
    return cpy;
};

export const updateLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State) => {
    return cpy;
};
