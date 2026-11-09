
import { z } from 'zod';
import { toBasisPoints } from '../../40.witness.unit/val/witness.model.js';
import { toCentiDecibels } from '../../13.sound.unit/val/sound.model.js';

export const StrictAxialCoordSchema = z
  .object({
    q: z.number().int({ message: 'COORD_Q_MUST_BE_INTEGER' }),
    r: z.number().int({ message: 'COORD_R_MUST_BE_INTEGER' })
  })
  .strict();

export const StrictRaycastQuerySchema = z
  .object({
    queryType: z.literal('RAYCAST'),
    origin: StrictAxialCoordSchema,
    target: StrictAxialCoordSchema,
    thresholdBps: z
      .number()
      .int()
      .min(0)
      .max(10000)
      .optional()
      .transform((val) => (val !== undefined ? toBasisPoints(val) : undefined)),
    calculationMode: z.enum(['SUBTRACTIVE_LINEAR', 'MULTIPLICATIVE_BEER_LAMBERT']).optional()
  })
  .strict();

export const StrictAcousticQuerySchema = z
  .object({
    queryType: z.literal('ACOUSTIC_WAVEFRONT'),
    sourceCoord: StrictAxialCoordSchema,
    sourceIntensityCdb: z
      .number()
      .int()
      .min(0)
      .max(12000)
      .transform((val) => toCentiDecibels(val)),
    ambientNoiseFloorCdb: z
      .number()
      .int()
      .min(0)
      .max(12000)
      .transform((val) => toCentiDecibels(val)),
    hearingThresholdCdb: z
      .number()
      .int()
      .min(0)
      .max(12000)
      .optional()
      .transform((val) => (val !== undefined ? toCentiDecibels(val) : undefined)),
    snrMinCdb: z
      .number()
      .int()
      .min(0)
      .max(6000)
      .optional()
      .transform((val) => (val !== undefined ? toCentiDecibels(val) : undefined)),
    workEnvelopeLimit: z.number().int().positive().max(2048).default(512)
  })
  .strict();

export const StrictRoutingQuerySchema = z
  .object({
    queryType: z.literal('BOUNDED_PATH'),
    origin: StrictAxialCoordSchema,
    destination: StrictAxialCoordSchema,
    maxBudgetCostUnits: z.number().int().positive(),
    blockedCells: z.array(z.number().int()).optional(),
    workEnvelopeLimit: z.number().int().positive().max(2048).default(512),
    episodeSeed: z.number().int().optional()
  })
  .strict();

export const StrictReachabilityQuerySchema = z
  .object({
    queryType: z.literal('REACHABILITY'),
    origin: StrictAxialCoordSchema,
    budgetCostUnits: z.number().int().positive(),
    blockedCells: z.array(z.number().int()).optional(),
    workEnvelopeLimit: z.number().int().positive().max(2048).default(512)
  })
  .strict();

export const StrictDisplacementQuerySchema = z
  .object({
    queryType: z.literal('DISPLACEMENT_EVICTION'),
    congestedCell: StrictAxialCoordSchema,
    budgetCostUnits: z.number().int().positive().default(1000),
    blockedCells: z.array(z.number().int()).optional(),
    workEnvelopeLimit: z.number().int().positive().max(2048).default(512),
    seedDigest: z.number().int().optional()
  })
  .strict();

export const SpatialQueryDiscriminatorSchema = z.discriminatedUnion('queryType', [
  StrictRaycastQuerySchema,
  StrictAcousticQuerySchema,
  StrictRoutingQuerySchema,
  StrictReachabilityQuerySchema,
  StrictDisplacementQuerySchema
]);

/**
 * Prohibited narrative property blacklist for diagnostic identification.
 */
export const BANNED_NARRATIVE_TAGS: readonly string[] = [
  'character_id',
  'actor_id',
  'speaker_id',
  'dialogue_text',
  'dialogue',
  'emotion',
  'camera_parenthetical',
  'observable_parenthetical',
  'grievance_id',
  'somatic_condition',
  'narrative_state',
  'personality'
] as const;
