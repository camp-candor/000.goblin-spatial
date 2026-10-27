import { z } from 'zod'
import { BasisPointsSchema } from '../../38.types.unit/fce/primitives.schema.js'
import { KineticVerbEnum } from '../../39.verbs.unit/fce/verbs.schema.js'
import { SomaticConditionSchema } from '../../37.trauma.unit/fce/condition.schema.js'

export const LocomotionTierEnum = z.enum([
    'BIPEDAL_NIMBLE',
    'BIPEDAL_LIMPING',
    'BIPEDAL_HUNCHED',
    'QUADRUPEDAL_SCUTTLE',
    'CRAWLWAY_SLITHER',
    'IMMOBILE',
])

export type LocomotionTier = z.infer<typeof LocomotionTierEnum>

export const SomaticVectorSchema = z
    .object({
        character_id: z.string().optional(),
        arms_available: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Arms available must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] Arms available cannot be negative',
            }),
        legs_available: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Legs available must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] Legs available cannot be negative',
            }),
        locomotion_tier: LocomotionTierEnum,
        somatic_strain_bp: BasisPointsSchema,
        conditions: z.array(SomaticConditionSchema).default([]),
        banned_verbs: z.array(KineticVerbEnum).default([]),
    })
    .strict()

export type SomaticVector = z.infer<typeof SomaticVectorSchema>
