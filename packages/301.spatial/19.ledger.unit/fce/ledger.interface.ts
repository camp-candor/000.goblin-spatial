export interface SpatialAuditQuadruple {
  readonly topologyHash: string; // 64-char hex SHA-256
  readonly overlayHash: string;  // 64-char hex SHA-256
  readonly queryHash: string;    // 64-char hex SHA-256 of CanonicalJCS(query)
  readonly receiptHash: string;  // 64-char hex SHA-256 of CanonicalJCS(receipt)
}

export interface SpatialLedgerEntry {
  readonly sequenceNumber: number;
  readonly occurredAtTick: number;
  readonly streamId: string;
  readonly queryType: string;
  readonly auditQuadruple: SpatialAuditQuadruple;
  readonly kernelVersion: string;
  readonly previousEventHash: string; // H_{n-1}
  readonly eventHash: string;         // H_n = SHA-256(H_{n-1} || CanonicalJCS(...))
}

export interface HashChainVerificationResult {
  readonly valid: boolean;
  readonly totalEntries: number;
  readonly genesisHash: string;
  readonly headHash: string;
  readonly brokenSequenceIndex?: number;
  readonly error?: string;
}

export interface LedgerLoggerOptions {
  readonly streamId: string;
  readonly kernelVersion?: string;
  readonly initialTopologyHash?: string;
  readonly initialOverlayHash?: string;
}
