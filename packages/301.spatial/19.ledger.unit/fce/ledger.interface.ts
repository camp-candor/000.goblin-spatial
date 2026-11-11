import type { Model } from '../../99.core/interface/model.interface.js';
import type { SpatialQueryType } from '../../14.port.unit/fce/port.interface.js';

export interface SpatialAuditQuadruple {
  readonly topologyHash: string;
  readonly overlayHash: string;
  readonly queryHash: string;
  readonly receiptHash: string;
}

export interface SpatialLedgerEntry {
  readonly sequenceNumber: number;
  readonly tickNumber: number;
  readonly streamId: string;
  readonly queryType: SpatialQueryType;
  readonly auditQuadruple: SpatialAuditQuadruple;
  readonly kernelVersion: string;
  readonly prevEventHash: string;
  readonly chainedEventHash: string;
  readonly recordedAtMs: number;
}

export interface LineageVerificationResult {
  readonly valid: boolean;
  readonly totalEntries: number;
  readonly brokenSequenceIndex?: number;
  readonly expectedHash?: string;
  readonly actualHash?: string;
  readonly failureReason?: string;
}

export default interface Ledger extends Model {
  idx: string;
  headSequence: number;
  lastEventHash: string;
  totalEntriesCommitted: number;
  entries: readonly SpatialLedgerEntry[];
}
