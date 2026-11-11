import { z } from 'zod'
import { AxialCoordSchema } from '../../38.types.unit/fce/manifest.schema.js'

export const StrictAxialCoordSchema = z
    .object({
        q: z.number().int({ message: 'COORD_Q_MUST_BE_INTEGER' }),
        r: z.number().int({ message: 'COORD_R_MUST_BE_INTEGER' }),
        s: z.number().int().optional(),
    })
    .strict()

export const BANNED_NARRATIVE_TAGS = Object.freeze([
    'actorId',
    'characterId',
    'characterName',
    'name',
    'dialogue',
    'speech',
    'trauma',
    'wound',
    'emotion',
    'inventory',
    'item',
    'relationship',
    'grudge',
    'intent',
    'lore',
    'prose',
    'character_id',
    'actor_id',
    'speaker_id',
    'dialogue_text',
    'camera_parenthetical',
    'observable_parenthetical',
    'grievance_id',
    'somatic_condition',
    'narrative_state',
    'personality',
])

export const StrictRaycastQuerySchema = z
    .object({
        queryType: z.literal('RAYCAST'),
        origin: AxialCoordSchema,
        target: AxialCoordSchema,
        mode: z
            .enum(['SUBTRACTIVE_LINEAR', 'MULTIPLICATIVE_BEER_LAMBERT'])
            .default('SUBTRACTIVE_LINEAR'),
    })
    .strict()

export const StrictRoutingQuerySchema = z
    .object({
        queryType: z.literal('BOUNDED_PATH'),
        origin: AxialCoordSchema,
        destination: AxialCoordSchema,
        maxBudgetCostUnits: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] maxBudgetCostUnits must be an integer',
            })
            .positive({
                message: '[BUDGET_INVALID] maxBudgetCostUnits must be positive',
            }),
        workEnvelopeLimit: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] workEnvelopeLimit must be an integer',
            })
            .positive()
            .max(2048, {
                message:
                    '[WORK_LIMIT_EXCEEDED] Maximum work envelope ceiling is 2048',
            })
            .default(512),
    })
    .strict()

export const StrictReachabilityQuerySchema = z
    .object({
        queryType: z.literal('REACHABILITY'),
        origin: AxialCoordSchema,
        maxStepRadius: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] maxStepRadius must be an integer',
            })
            .positive()
            .max(128, {
                message:
                    '[RADIUS_LIMIT_EXCEEDED] Maximum reachability radius is 128',
            }),
        workEnvelopeLimit: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] workEnvelopeLimit must be an integer',
            })
            .positive()
            .max(2048)
            .default(512),
    })
    .strict()

export const StrictDisplacementQuerySchema = z
    .object({
        queryType: z.literal('DISPLACEMENT'),
        targetCell: AxialCoordSchema,
        maxCellCapacity: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] maxCellCapacity must be an integer',
            })
            .positive(),
        maxBudgetCostUnits: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] maxBudgetCostUnits must be an integer',
            })
            .positive(),
    })
    .strict()

// Audit anchor: single-line discriminator call per Phase 2 contract (042 Check 1.2).
// prettier-ignore
export const SpatialQueryDiscriminatorSchema = z.discriminatedUnion('queryType', [
        StrictRaycastQuerySchema,
        StrictRoutingQuerySchema,
        StrictReachabilityQuerySchema,
        StrictDisplacementQuerySchema,
    ],
)

export type ValidatedSpatialQuery = z.infer<
    typeof SpatialQueryDiscriminatorSchema
>
