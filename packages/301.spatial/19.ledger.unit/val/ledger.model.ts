import { z } from 'zod';

export const GENESIS_HASH_64 = '0'.repeat(64);

export const Sha256HashSchema = z
  .string()
  .length(64, { message: '[HASH_LENGTH_BREACH] SHA-256 hash must be exactly 64 characters' })
  .regex(/^[a-f0-9]{64}$/, {
    message: '[HASH_FORMAT_BREACH] SHA-256 hash must be lowercase hexadecimal',
  });

export const SpatialAuditQuadrupleSchema = z
  .object({
    topologyHash: Sha256HashSchema,
    overlayHash: Sha256HashSchema,
    queryHash: Sha256HashSchema,
    receiptHash: Sha256HashSchema,
  })
  .strict();

export const SpatialLedgerEntrySchema = z
  .object({
    sequenceNumber: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] sequenceNumber must be an integer' })
      .positive({ message: '[SEQUENCE_INVALID] sequenceNumber must be positive' }),
    tickNumber: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] tickNumber must be an integer' })
      .nonnegative({ message: '[TICK_INVALID] tickNumber cannot be negative' }),
    streamId: z.string().min(1, { message: '[STREAM_ID_EMPTY] streamId cannot be empty' }),
    queryType: z.enum(['RAYCAST', 'BOUNDED_PATH', 'REACHABILITY', 'DISPLACEMENT']),
    auditQuadruple: SpatialAuditQuadrupleSchema,
    kernelVersion: z.string().min(1),
    prevEventHash: Sha256HashSchema,
    chainedEventHash: Sha256HashSchema,
    recordedAtMs: z.number().int().nonnegative(),
  })
  .strict();

export type ValidatedSpatialAuditQuadruple = z.infer<typeof SpatialAuditQuadrupleSchema>;
export type ValidatedSpatialLedgerEntry = z.infer<typeof SpatialLedgerEntrySchema>;
