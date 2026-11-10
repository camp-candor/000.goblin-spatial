import { z } from 'zod';

export const DEFAULT_KERNEL_VERSION = "0.1.0";
export const GENESIS_PREFIX = "GOBLIN-SPATIAL-GENESIS::";

export const Sha256HashSchema = z.string().length(64).regex(/^[a-f0-9]+$/);

export const SpatialAuditQuadrupleSchema = z.object({
  topologyHash: Sha256HashSchema,
  overlayHash: Sha256HashSchema,
  queryHash: Sha256HashSchema,
  receiptHash: Sha256HashSchema,
}).strict();

export const SpatialLedgerEntrySchema = z.object({
  seq: z.number().int().nonnegative(),
  tick: z.number().int().nonnegative(),
  streamId: z.string(),
  queryType: z.string(),
  kernelVersion: z.string(),
  quadruple: SpatialAuditQuadrupleSchema,
  eventHash: Sha256HashSchema,
}).strict();

export type LedgerModel = {
    idx: string;
}
