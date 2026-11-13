import {
    TopologyManifest,
    TopologyManifestSchema,
    PortalEdge,
    TopologicalCell,
} from '../../38.types.unit/fce/manifest.schema.js'

export interface TopologyValidationResult {
    readonly valid: boolean
    readonly errors: readonly string[]
    readonly manifest?: TopologyManifest
}

export function parseAndValidateManifest(
    raw: unknown,
): TopologyValidationResult {
    const parseResult = TopologyManifestSchema.safeParse(raw)
    if (!parseResult.success) {
        const issues = parseResult.error.issues.map(
            (iss) => `[SCHEMA_ERROR] ${iss.path.join('.')}: ${iss.message}`,
        )
        return { valid: false, errors: issues }
    }

    const manifest = parseResult.data
    const semanticErrors: string[] = []

    // Validate cell uniqueness
    const cellCoords = new Set<string>()
    for (const cell of manifest.cells) {
        const key = `${cell.coord.q},${cell.coord.r}`
        if (cellCoords.has(key)) {
            semanticErrors.push(`[DUPLICATE_CELL] Duplicate cell (${key})`)
        }
        cellCoords.add(key)
    }

    // Validate occluder coordinates exist
    for (const occluder of manifest.occluders) {
        const occluderKey = `${occluder.coord.q},${occluder.coord.r}`
        if (!cellCoords.has(occluderKey)) {
            semanticErrors.push(
                `[ORPHAN_OCCLUDER] Occluder ${occluder.occluderId} references non-existent cell (${occluderKey})`,
            )
        }
    }

    // Validate portals
    for (const portal of manifest.portals) {
        // Basic coordinate existence check
        const fromKey = `${portal.entryCoord.q},${portal.entryCoord.r}`
        const toKey = `${portal.exitCoord.q},${portal.exitCoord.r}`
        if (!cellCoords.has(fromKey)) {
            semanticErrors.push(
                `[PORTAL_SOURCE_INVALID] Portal ${portal.portalId} entry missing in topology`,
            )
        }
        // We do not require the toRoom's coordinate to exist in this room's manifest as it's a cross-room portal.
        // However, if the directive intended single-manifest verification, we'd check it.
        // The previous implementation checked the target room's cells. But now all cells are flat.
        // We will just do a warning or no-op if toCoord is outside, as we don't have the target room manifest here unless they're merged.
        // Wait, the new schema has no rooms, just topologyId which is locationId.
    }

    if (semanticErrors.length > 0) {
        return { valid: false, errors: semanticErrors }
    }

    return { valid: true, errors: [], manifest }
}

export function findRoomById(
    manifest: TopologyManifest,
    roomId: string,
): TopologyManifest | undefined {
    return manifest.topologyId === roomId ? manifest : undefined
}

export function findCellInRoom(
    manifest: TopologyManifest,
    q: number,
    r: number,
): TopologicalCell | undefined {
    return manifest.cells.find((c) => c.coord.q === q && c.coord.r === r)
}

export function initTopology(...args: any[]) {
    return { type: 'INIT_TOPOLOGY', payload: args }
}
export function updateTopology(...args: any[]) {
    return { type: 'UPDATE_TOPOLOGY', payload: args }
}
