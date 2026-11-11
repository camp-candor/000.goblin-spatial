import { z } from 'zod'
import { CentiDecibelsSchema } from './acoustic.schema.js'
import {
    Sha256HashSchema,
    PortalIdSchema,
    LocationIdSchema,
} from './ident.schema.js'

export const AXIAL_COORD_MIN = -32768
export const AXIAL_COORD_MAX = 32767

/**
 * Strict 2D Axial Hex Coordinate Schema.
 * Enforces exact integer values within [-32768, 32767] and planar cubic invariant q + r + s === 0.
 */
export const AxialCoordSchema = z
    .object({
        q: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Coordinate q must be an integer',
            })
            .min(AXIAL_COORD_MIN, {
                message: '[OUT_OF_BOUNDS] Coordinate q underflows -32768',
            })
            .max(AXIAL_COORD_MAX, {
                message: '[OUT_OF_BOUNDS] Coordinate q overflows 32767',
            }),
        r: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Coordinate r must be an integer',
            })
            .min(AXIAL_COORD_MIN, {
                message: '[OUT_OF_BOUNDS] Coordinate r underflows -32768',
            })
            .max(AXIAL_COORD_MAX, {
                message: '[OUT_OF_BOUNDS] Coordinate r overflows 32767',
            }),
        s: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Coordinate s must be an integer',
            })
            .min(AXIAL_COORD_MIN * 2, {
                message: '[OUT_OF_BOUNDS] Coordinate s underflows',
            })
            .max(AXIAL_COORD_MAX * 2, {
                message: '[OUT_OF_BOUNDS] Coordinate s overflows',
            }),
    })
    .strict()
    .refine((data) => data.q + data.r + data.s === 0, {
        message:
            '[CUBIC_INVARIANT_BREACH] Planar coordinates must satisfy q + r + s === 0',
    })

export type AxialCoord = {
    readonly q: number
    readonly r: number
    readonly s: number
}

/**
 * Branded 32-bit unsigned integer packed axial cell identifier.
 */
import type { PackedAxial as BasePackedAxial } from '../../28.axial.unit/val/axial.model.js'
export type PackedAxial = BasePackedAxial

export function packAxialCell(q: number, r: number): PackedAxial {
    if (!Number.isInteger(q) || !Number.isInteger(r)) {
        throw new TypeError(
            '[FLOAT_PROHIBITED] Coordinates must be exact integers',
        )
    }
    if (
        q < AXIAL_COORD_MIN ||
        q > AXIAL_COORD_MAX ||
        r < AXIAL_COORD_MIN ||
        r > AXIAL_COORD_MAX
    ) {
        throw new RangeError(
            '[OUT_OF_BOUNDS] Coordinate outside [-32768, 32767]',
        )
    }
    const qOffset = (q + 32768) & 0xffff
    const rOffset = (r + 32768) & 0xffff
    return (((qOffset << 16) | rOffset) >>> 0) as PackedAxial
}

export function unpackAxialCell(packed: number): AxialCoord {
    if (!Number.isInteger(packed) || packed < 0 || packed > 0xffffffff) {
        throw new TypeError(
            '[INVALID_PACKED_CELL] PackedAxial must be an unsigned 32-bit integer',
        )
    }
    const qOffset = (packed >>> 16) & 0xffff
    const rOffset = packed & 0xffff
    const q = qOffset - 32768
    const r = rOffset - 32768
    const s = Object.is(-q - r, -0) ? 0 : -q - r
    return Object.freeze({ q, r, s })
}

export const TopologicalCellSchema = z
    .object({
        coord: AxialCoordSchema,
        packedId: z.number().int().nonnegative(),
        costUnits: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] Traversal cost must be integer',
            })
            .positive(),
        passable: z.boolean(),
    })
    .strict()

export type TopologicalCell = z.infer<typeof TopologicalCellSchema>

export const PortalEdgeSchema = z
    .object({
        portalId: PortalIdSchema,
        fromRoomId: LocationIdSchema,
        toRoomId: LocationIdSchema,
        entryCoord: AxialCoordSchema,
        exitCoord: AxialCoordSchema,
        acousticDampingCdb: CentiDecibelsSchema,
        traversableDefault: z.boolean(),
    })
    .strict()

export type PortalEdge = z.infer<typeof PortalEdgeSchema>

export const OccluderDefinitionSchema = z
    .object({
        occluderId: z.string().regex(/^occ_[a-z0-9_]+$/, {
            message: '[INVALID_ID] Must match ^occ_[a-z0-9_]+$',
        }),
        coord: AxialCoordSchema,
        blocksLoSDefault: z.boolean(),
        attenuationCdb: CentiDecibelsSchema,
    })
    .strict()

export type OccluderDefinition = z.infer<typeof OccluderDefinitionSchema>

export const TopologyManifestSchema = z
    .object({
        topologyId: LocationIdSchema,
        schemaVersion: z.string().regex(/^v[0-9]+\.[0-9]+$/, {
            message: '[INVALID_VERSION] Version must match ^v[0-9]+\\.[0-9]+$',
        }),
        merkleRootHex: Sha256HashSchema,
        cells: z.array(TopologicalCellSchema),
        portals: z.array(PortalEdgeSchema),
        occluders: z.array(OccluderDefinitionSchema),
    })
    .strict()

export type TopologyManifest = z.infer<typeof TopologyManifestSchema>
