import { z } from 'zod'
import { BasisPointsSchema } from '../../38.types.unit/fce/primitives.schema.js'
import { KineticVerbEnum } from '../../39.verbs.unit/fce/verbs.schema.js'

export const AnatomicalLocusEnum = z.enum([
    'LEFT_ARM',
    'RIGHT_ARM',
    'LEFT_LEG',
    'RIGHT_LEG',
    'HEAD',
    'TORSO',
    'SPINE',
    'EYES',
    'THROAT',
    'GENERAL',
])

export type AnatomicalLocus = z.infer<typeof AnatomicalLocusEnum>

export const SomaticConditionSchema = z
    .object({
        id: z
            .string()
            .min(1, { message: '[INVALID_ID] Condition ID cannot be empty' }),
        name: z.string().optional(),
        locus: AnatomicalLocusEnum,
        severity_bp: BasisPointsSchema,
        impairment_penalty_arms: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Arm penalty must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] Arm penalty cannot be negative',
            })
            .default(0),
        impairment_penalty_legs: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Leg penalty must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] Leg penalty cannot be negative',
            })
            .default(0),
        added_banned_verbs: z.array(KineticVerbEnum).default([]),
        description: z.string().optional(),
    })
    .strict()

export type SomaticCondition = z.infer<typeof SomaticConditionSchema>
