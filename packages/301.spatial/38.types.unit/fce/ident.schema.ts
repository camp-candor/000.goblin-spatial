import { z } from 'zod'

/**
 * Strict 64-character lowercase hexadecimal SHA-256 digest string.
 */
export const Sha256HashSchema = z.string().regex(/^[0-9a-f]{64}$/, {
    message:
        '[INVALID_SHA256] Must be a 64-character lowercase SHA-256 hex string',
})

export type Sha256Hash = z.infer<typeof Sha256HashSchema>

/**
 * Namespaced Entity Identifier Schemas.
 */
export const CharacterIdSchema = z.string().regex(/^char_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Character ID must match ^char_[a-z0-9_]+$',
})

export const LocationIdSchema = z.string().regex(/^loc_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Location ID must match ^loc_[a-z0-9_]+$',
})

export const PossessionIdSchema = z.string().regex(/^item_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Possession ID must match ^item_[a-z0-9_]+$',
})

export const GrievanceIdSchema = z.string().regex(/^grv_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Grievance ID must match ^grv_[a-z0-9_]+$',
})

export const MysteryIdSchema = z.string().regex(/^mystery_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Mystery ID must match ^mystery_[a-z0-9_]+$',
})

export const PortalIdSchema = z.string().regex(/^prt_[a-z0-9_]+$/, {
    message: '[INVALID_ID] Portal ID must match ^prt_[a-z0-9_]+$',
})

export type CharacterId = z.infer<typeof CharacterIdSchema>
export type LocationId = z.infer<typeof LocationIdSchema>
export type PossessionId = z.infer<typeof PossessionIdSchema>
export type GrievanceId = z.infer<typeof GrievanceIdSchema>
export type MysteryId = z.infer<typeof MysteryIdSchema>
export type PortalId = z.infer<typeof PortalIdSchema>
