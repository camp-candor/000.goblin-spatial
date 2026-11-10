import LedgerBit from './ledger.bit.js'

export default interface Ledger {
    // idx:string;
    // ledgerBitList: LedgerBit[];
    // ledgerBits:any;
}

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
    quadruple: SpatialAuditQuadruple;
    kernelVersion: string;
    eventHash: string;
}

export interface HashChainVerificationResult {
    valid: boolean;
    error?: string;
    invalidSequenceIdx?: number;
}

export interface LedgerLoggerOptions {
    streamId: string;
    kernelVersion?: string;
}
