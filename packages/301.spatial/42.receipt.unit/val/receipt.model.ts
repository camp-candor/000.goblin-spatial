import { z } from 'zod';
import { AxialCoordSchema } from '../../38.types.unit/fce/manifest.schema.js';
import { SpatialAuditQuadrupleSchema } from '../../19.ledger.unit/val/ledger.model.js';

export const PackedAxialSchema = z
  .number()
  .int({ message: '[FLOAT_PROHIBITED] PackedAxial must be an integer' })
  .min(0, { message: '[OUT_OF_BOUNDS] PackedAxial cannot be negative' })
  .max(0xffffffff, { message: '[OUT_OF_BOUNDS] PackedAxial overflows 32-bit uint' });

export const PathReceiptSuccessSchema = z
  .object({
    ok: z.literal(true),
    originPacked: PackedAxialSchema,
    destinationPacked: PackedAxialSchema,
    path: z.array(PackedAxialSchema),
    totalCostUnits: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] totalCostUnits must be an integer' })
      .nonnegative({ message: '[COST_NEGATIVE] totalCostUnits cannot be negative' }),
    stepsExpanded: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] stepsExpanded must be an integer' })
      .nonnegative(),
    auditQuadruple: SpatialAuditQuadrupleSchema,
  })
  .strict();

export const PathReceiptFailureSchema = z
  .object({
    ok: z.literal(false),
    originPacked: PackedAxialSchema,
    destinationPacked: PackedAxialSchema,
    failureCode: z.enum(['UNREACHABLE', 'BUDGET_EXCEEDED', 'IMPASSABLE']),
    stepsExpanded: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] stepsExpanded must be an integer' })
      .nonnegative(),
    auditQuadruple: SpatialAuditQuadrupleSchema,
  })
  .strict();

export const PathReceiptSchema = z.discriminatedUnion('ok', [
  PathReceiptSuccessSchema,
  PathReceiptFailureSchema,
]);

export const OpticalPerceptEvidenceSchema = z
  .object({
    modality: z.literal('OPTICAL'),
    transmissionBps: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] transmissionBps must be an integer' })
      .min(0, { message: '[BASIS_POINT_UNDERFLOW] transmissionBps minimum is 0' })
      .max(10000, { message: '[BASIS_POINT_OVERFLOW] transmissionBps maximum is 10000' }),
    topologicalDistance: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] topologicalDistance must be an integer' })
      .nonnegative(),
    occludingBarrierCoord: AxialCoordSchema.nullable(),
  })
  .strict();

export const AcousticPerceptEvidenceSchema = z
  .object({
    modality: z.literal('ACOUSTIC'),
    intensityCdb: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] intensityCdb must be an integer' })
      .nonnegative(),
    noiseFloorCdb: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] noiseFloorCdb must be an integer' })
      .nonnegative(),
    snrMarginCdb: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] snrMarginCdb must be an integer' }),
    portalHopCount: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] portalHopCount must be an integer' })
      .nonnegative(),
  })
  .strict();

export const PerceptEvidenceSchema = z.discriminatedUnion('modality', [
  OpticalPerceptEvidenceSchema,
  AcousticPerceptEvidenceSchema,
]);

export const PerceptCandidateSchema = z
  .object({
    sourceCoord: AxialCoordSchema,
    observerCoord: AxialCoordSchema,
    qualityScorePerMille: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] qualityScorePerMille must be an integer' })
      .min(0, { message: '[PER_MILLE_UNDERFLOW] Minimum quality is 0' })
      .max(1000, { message: '[PER_MILLE_OVERFLOW] Maximum quality is 1000' }),
    arrivalBearing: z
      .union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
      .nullable(),
    isOccluded: z.boolean(),
    evidence: PerceptEvidenceSchema,
    auditQuadruple: SpatialAuditQuadrupleSchema,
  })
  .strict();

export const DisplacementReceiptSuccessSchema = z
  .object({
    ok: z.literal(true),
    targetCellPacked: PackedAxialSchema,
    resolvedCellPacked: PackedAxialSchema,
    relocationCostUnits: z
      .number()
      .int({ message: '[FLOAT_PROHIBITED] relocationCostUnits must be an integer' })
      .nonnegative(),
    wasEvicted: z.boolean(),
    auditQuadruple: SpatialAuditQuadrupleSchema,
  })
  .strict();

export const DisplacementReceiptFailureSchema = z
  .object({
    ok: z.literal(false),
    targetCellPacked: PackedAxialSchema,
    failureCode: z.enum(['CAPACITY_EXHAUSTED', 'BUDGET_EXCEEDED', 'UNREACHABLE']),
    auditQuadruple: SpatialAuditQuadrupleSchema,
  })
  .strict();

export const DisplacementReceiptSchema = z.discriminatedUnion('ok', [
  DisplacementReceiptSuccessSchema,
  DisplacementReceiptFailureSchema,
]);
