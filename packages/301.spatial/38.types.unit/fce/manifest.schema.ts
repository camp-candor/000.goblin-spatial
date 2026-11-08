import { z } from 'zod'

export const AxialCoordSchema = z
    .object({
        q: z.number().int(),
        r: z.number().int(),
    })
    .strict()

export const TopologicalCellSchema = z
    .object({
        q: z.number().int(),
        r: z.number().int(),
        costUnits: z.number().int().positive(),
    })
    .strict()

export const PortalEdgeSchema = z
    .object({
        portalId: z.string().min(1),
        fromRoomId: z.string().min(1),
        toRoomId: z.string().min(1),
        fromCoord: AxialCoordSchema,
        toCoord: AxialCoordSchema,
        acousticDampingCdb: z.number().int().nonnegative(),
        traversableDefault: z.boolean(),
    })
    .strict()

export const OccluderDefinitionSchema = z
    .object({
        occluderId: z.string().min(1),
        roomId: z.string().min(1),
        coord: AxialCoordSchema,
        blocksLoSDefault: z.boolean(),
        acousticDampingCdb: z.number().int().nonnegative(),
    })
    .strict()

export const LocationNodeSchema = z
    .object({
        roomId: z.string().min(1),
        roomName: z.string().min(1),
        cellPitchMm: z.number().int().positive(),
        ambientNoiseFloorCdb: z.number().int().nonnegative(),
        maxAdultGoblins: z.number().int().positive(),
        cells: z.array(TopologicalCellSchema).min(1),
        portals: z.array(PortalEdgeSchema),
        occluders: z.array(OccluderDefinitionSchema),
    })
    .strict()

export const TopologyManifestSchema = z
    .object({
        manifestVersion: z.string().min(1),
        rootHash: z.string().regex(/^[0-9a-f]{64}$/),
        rooms: z.array(LocationNodeSchema).min(1),
    })
    .strict()

export const DynamicOverlaySchema = z
    .object({
        overlayId: z.string().min(1),
        occluderOverrides: z.record(z.string(), z.boolean()),
        portalOverrides: z.record(z.string(), z.boolean()),
        attenuationDeltasCdb: z.record(z.string(), z.number().int()),
    })
    .strict()

export type AxialCoordInput = z.infer<typeof AxialCoordSchema>
export type TopologicalCell = z.infer<typeof TopologicalCellSchema>
export type PortalEdge = z.infer<typeof PortalEdgeSchema>
export type OccluderDefinition = z.infer<typeof OccluderDefinitionSchema>
export type LocationNode = z.infer<typeof LocationNodeSchema>
export type TopologyManifest = z.infer<typeof TopologyManifestSchema>
export type DynamicOverlay = z.infer<typeof DynamicOverlaySchema>
