import { z } from 'zod'
import { CentiDecibelsSchema } from '../../38.types.unit/fce/acoustic.schema.js'
import { LocationIdSchema } from '../../38.types.unit/fce/ident.schema.js'
import { BasisPointsSchema } from '../../38.types.unit/fce/primitives.schema.js'

export const PortalIdSchema = z.string().regex(/^prt_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Portal ID must match ^prt_[a-z0-9_]+$',
})
export type PortalId = z.infer<typeof PortalIdSchema>

export const PortalSchema = z
    .object({
        portal_id: PortalIdSchema,
        target_location_id: LocationIdSchema,
        target_portal_id: PortalIdSchema,
        acoustic_dampening_cdb: CentiDecibelsSchema.default(1200),
        traversal_cost: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] traversal_cost must be an integer',
            })
            .positive({
                message: '[OUT_OF_BOUNDS] traversal_cost must be positive',
            })
            .default(100),
        is_passable: z.boolean().default(true),
        is_latched: z.boolean().default(false),
    })
    .strict()
export type Portal = z.infer<typeof PortalSchema>

export const LocationSchema = z
    .object({
        schema_version: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] schema_version must be an integer',
            })
            .min(1, { message: '[OUT_OF_BOUNDS] schema_version must be >= 1' })
            .default(1),
        id: LocationIdSchema,
        name: z.string().min(1),
        max_occupancy: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] max_occupancy must be an integer',
            })
            .positive({
                message: '[OUT_OF_BOUNDS] max_occupancy must be positive',
            })
            .default(4),
        ambient_noise_cdb: CentiDecibelsSchema.default(1500),
        temperature_bp: BasisPointsSchema.default(5000),
        portals: z.array(PortalSchema).default([]),
    })
    .strict()
export type Location = z.infer<typeof LocationSchema>
