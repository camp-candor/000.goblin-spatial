import LedgerBit from './ledger.bit.js';

export interface SpatialAuditQuadruple {
    topologyHash: string;
    overlayHash: string;
    queryHash: string;
    receiptHash: string;
}

export interface SpatialLedgerEntry {
    seq: number;
    tick: number;
    streamId: string;
    queryType: string;
    kernelVersion: string;
    quadruple: SpatialAuditQuadruple;
    eventHash: string;
}

export interface HashChainVerificationResult {
    isValid: boolean;
    error?: string;
    sequenceGaps: number;
    hashMismatches: number;
}

export interface LedgerLoggerOptions {
    streamId: string;
    genesisHash?: string;
}

export default interface Ledger {
    // idx:string;
    // ledgerBitList: LedgerBit[];
    // ledgerBits:any;
}
