import { z } from 'zod';

export const Sha256HashSchema = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/, { message: 'MUST_BE_LOWERCASE_HEX_SHA256' });

export const SpatialAuditQuadrupleSchema = z
  .object({
    topologyHash: Sha256HashSchema,
    overlayHash: Sha256HashSchema,
    queryHash: Sha256HashSchema,
    receiptHash: Sha256HashSchema
  })
  .strict();

export const SpatialLedgerEntrySchema = z
  .object({
    sequenceNumber: z.number().int().min(1),
    occurredAtTick: z.number().int().min(0),
    streamId: z.string().min(1),
    queryType: z.string().min(1),
    auditQuadruple: SpatialAuditQuadrupleSchema,
    kernelVersion: z.string().min(1),
    previousEventHash: Sha256HashSchema,
    eventHash: Sha256HashSchema
  })
  .strict();

export const DEFAULT_KERNEL_VERSION = '0.1.0';
export const GENESIS_PREFIX = 'GOBLIN-SPATIAL-GENESIS::';
