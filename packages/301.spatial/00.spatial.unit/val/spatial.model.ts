import { z } from 'zod';
import { Sha256HashSchema, SpatialAuditQuadrupleSchema } from '../../19.ledger.unit/val/ledger.model.js';

export const DEFAULT_KERNEL_VERSION = '0.1.0';

export const SpatialExecutionContextSchema = z
  .object({
    topologyHash: Sha256HashSchema.optional(),
    overlayHash: Sha256HashSchema.optional(),
    currentTick: z.number().int().min(0).optional(),
    streamId: z.string().min(1).optional(),
    recordLedger: z.boolean().optional()
  })
  .strict();

export const SynchronousExecutionReceiptSchema = z
  .object({
    ok: z.boolean(),
    queryType: z.enum([
      'RAYCAST',
      'ACOUSTIC_WAVEFRONT',
      'BOUNDED_PATH',
      'REACHABILITY',
      'DISPLACEMENT_EVICTION'
    ]),
    result: z.unknown(),
    durationMicros: z.number().int().min(0),
    auditQuadruple: SpatialAuditQuadrupleSchema,
    ledgerEntry: z.unknown().optional(),
    error: z.string().optional()
  })
  .strict();
